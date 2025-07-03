import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/pages/api/notes';

// Mock dependencies
vi.mock('@/lib/middleware', () => ({
  authenticateRequest: vi.fn(),
  createUnauthorizedResponse: vi.fn(() => new Response('Unauthorized', { status: 401 })),
  createBadRequestResponse: vi.fn((msg) => new Response(msg, { status: 400 })),
  createServerErrorResponse: vi.fn((msg) => new Response(msg, { status: 500 })),
}));

vi.mock('@/lib/validation', () => ({
  validateNoteContent: vi.fn(),
  sanitizeContent: vi.fn((content) => content),
}));

vi.mock('@/lib/rate-limiter', () => ({
  withRateLimit: vi.fn(),
  RATE_LIMITS: {
    notes: { windowMs: 60000, max: 30 }
  }
}));

vi.mock('@/lib/database', () => ({
  database: {
    execute: vi.fn(),
  },
}));

// Environment variables are mocked in vitest.config.ts

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('/api/notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should create a new note successfully', async () => {
      // Setup mocks
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockRequest = {
        json: vi.fn().mockResolvedValue({ content: 'Test note content' }),
      } as any;

      const { authenticateRequest } = await import('@/lib/middleware');
      const { validateNoteContent, sanitizeContent } = await import('@/lib/validation');
      const { withRateLimit } = await import('@/lib/rate-limiter');
      const { database } = await import('@/lib/database');

      vi.mocked(authenticateRequest).mockResolvedValue(mockUser);
      vi.mocked(validateNoteContent).mockReturnValue({ isValid: true });
      vi.mocked(sanitizeContent).mockReturnValue('Test note content');
      vi.mocked(withRateLimit).mockReturnValue({ 
        allowed: true, 
        headers: { 'X-RateLimit-Remaining': '29' } 
      });
      vi.mocked(database.execute).mockResolvedValue({ 
        rows: [], 
        columns: [], 
        columnTypes: [], 
        rowsAffected: 1, 
        lastInsertRowid: 1n, 
        toJSON: () => ({}) 
      });

      // Mock Groq API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Generated Title' } }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'tag1, tag2, tag3' } }]
          })
        });

      const response = await POST({ request: mockRequest } as any);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.note.title).toBe('Generated Title');
      expect(result.note.content).toBe('Test note content');
      expect(result.note.tags).toEqual(['tag1', 'tag2', 'tag3']);
      expect(database.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('INSERT INTO notes'),
          args: expect.arrayContaining([
            expect.any(String), // noteId
            'user123', // userId
            'Generated Title', // title
            'Test note content', // content
            JSON.stringify(['tag1', 'tag2', 'tag3']) // tags
          ])
        })
      );
    });

    it('should return 401 for unauthenticated requests', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({ content: 'Test content' }),
      } as any;

      const { authenticateRequest } = await import('@/lib/middleware');
      vi.mocked(authenticateRequest).mockRejectedValue(new Error('Unauthorized'));

      const response = await POST({ request: mockRequest } as any);
      
      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid content', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockRequest = {
        json: vi.fn().mockResolvedValue({ content: '' }),
      } as any;

      const { authenticateRequest } = await import('@/lib/middleware');
      const { validateNoteContent } = await import('@/lib/validation');
      const { withRateLimit } = await import('@/lib/rate-limiter');

      vi.mocked(authenticateRequest).mockResolvedValue(mockUser);
      vi.mocked(validateNoteContent).mockReturnValue({ 
        isValid: false, 
        error: 'Content is required' 
      });
      vi.mocked(withRateLimit).mockReturnValue({ 
        allowed: true, 
        headers: {} 
      });

      const response = await POST({ request: mockRequest } as any);
      
      expect(response.status).toBe(400);
    });

    it('should return 429 for rate limit exceeded', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockRequest = {
        json: vi.fn().mockResolvedValue({ content: 'Test content' }),
      } as any;

      const { authenticateRequest } = await import('@/lib/middleware');
      const { withRateLimit } = await import('@/lib/rate-limiter');

      vi.mocked(authenticateRequest).mockResolvedValue(mockUser);
      vi.mocked(withRateLimit).mockReturnValue({ 
        allowed: false, 
        headers: { 'X-RateLimit-Remaining': '0' } 
      });

      const response = await POST({ request: mockRequest } as any);
      
      expect(response.status).toBe(429);
    });
  });

  describe('GET', () => {
    it('should fetch notes successfully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockRequest = {} as any;
      const mockUrl = {
        searchParams: new URLSearchParams()
      } as any;

      const { authenticateRequest } = await import('@/lib/middleware');
      const { withRateLimit } = await import('@/lib/rate-limiter');
      const { database } = await import('@/lib/database');

      vi.mocked(authenticateRequest).mockResolvedValue(mockUser);
      vi.mocked(withRateLimit).mockReturnValue({ 
        allowed: true, 
        headers: { 'X-RateLimit-Remaining': '29' } 
      });
      
      const mockNotes = [
        {
          id: 'note1',
          title: 'Test Note 1',
          content: 'Content 1',
          tags: '["tag1", "tag2"]',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          length: 6
        }
      ];

      vi.mocked(database.execute)
        .mockResolvedValueOnce({ 
          rows: mockNotes, 
          columns: [], 
          columnTypes: [], 
          rowsAffected: 1, 
          lastInsertRowid: 1n, 
          toJSON: () => ({}) 
        })
        .mockResolvedValueOnce({ 
          rows: [{ total: 1, length: 1 }], 
          columns: [], 
          columnTypes: [], 
          rowsAffected: 1, 
          lastInsertRowid: 1n, 
          toJSON: () => ({}) 
        });

      const response = await GET({ request: mockRequest, url: mockUrl } as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.notes).toHaveLength(1);
      expect(result.notes[0].id).toBe('note1');
      expect(result.notes[0].tags).toEqual(['tag1', 'tag2']);
    });

    it('should apply search filters', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockRequest = {} as any;
      const mockUrl = {
        searchParams: new URLSearchParams('search=test&tag=work')
      } as any;

      const { authenticateRequest } = await import('@/lib/middleware');
      const { withRateLimit } = await import('@/lib/rate-limiter');
      const { database } = await import('@/lib/database');

      vi.mocked(authenticateRequest).mockResolvedValue(mockUser);
      vi.mocked(withRateLimit).mockReturnValue({ 
        allowed: true, 
        headers: {} 
      });
      vi.mocked(database.execute)
        .mockResolvedValueOnce({ 
          rows: [], 
          columns: [], 
          columnTypes: [], 
          rowsAffected: 0, 
          lastInsertRowid: 0n, 
          toJSON: () => ({}) 
        })
        .mockResolvedValueOnce({ 
          rows: [{ total: 0, length: 1 }], 
          columns: [], 
          columnTypes: [], 
          rowsAffected: 1, 
          lastInsertRowid: 1n, 
          toJSON: () => ({}) 
        });

      await GET({ request: mockRequest, url: mockUrl } as any);

      expect(database.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('(title LIKE ? OR content LIKE ?)'),
          args: expect.arrayContaining(['user123', '%test%', '%test%', '%"work"%'])
        })
      );
    });

    it('should return 401 for unauthenticated requests', async () => {
      const mockRequest = {} as any;
      const mockUrl = {
        searchParams: new URLSearchParams()
      } as any;

      const { authenticateRequest } = await import('@/lib/middleware');
      vi.mocked(authenticateRequest).mockRejectedValue(new Error('Unauthorized'));

      const response = await GET({ request: mockRequest, url: mockUrl } as any);
      
      expect(response.status).toBe(401);
    });

    it('should return 429 for rate limit exceeded', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockRequest = {} as any;
      const mockUrl = {
        searchParams: new URLSearchParams()
      } as any;

      const { authenticateRequest } = await import('@/lib/middleware');
      const { withRateLimit } = await import('@/lib/rate-limiter');

      vi.mocked(authenticateRequest).mockResolvedValue(mockUser);
      vi.mocked(withRateLimit).mockReturnValue({ 
        allowed: false, 
        headers: { 'X-RateLimit-Remaining': '0' } 
      });

      const response = await GET({ request: mockRequest, url: mockUrl } as any);
      
      expect(response.status).toBe(429);
    });
  });
});