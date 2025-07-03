import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as transcribePost } from '@/pages/api/transcribe';
import { POST as notesPost, GET as notesGet } from '@/pages/api/notes';

// Mock dependencies
vi.mock('@/lib/middleware', () => ({
  authenticateRequest: vi.fn(),
  createUnauthorizedResponse: vi.fn(() => new Response('Unauthorized', { status: 401 })),
  createBadRequestResponse: vi.fn((msg) => new Response(msg, { status: 400 })),
  createServerErrorResponse: vi.fn((msg) => new Response(msg, { status: 500 })),
}));

vi.mock('@/lib/validation', () => ({
  validateAudioFile: vi.fn(),
  validateNoteContent: vi.fn(),
  sanitizeContent: vi.fn((content) => content),
}));

vi.mock('@/lib/rate-limiter', () => ({
  withRateLimit: vi.fn(),
  RATE_LIMITS: {
    transcription: { windowMs: 60000, max: 5 },
    notes: { windowMs: 60000, max: 30 }
  }
}));

vi.mock('@/lib/database', () => ({
  database: {
    execute: vi.fn(),
  },
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Voice Notes Integration Flow', () => {
  const mockUser = { id: 'user123', email: 'test@example.com' };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup default mocks
    const { authenticateRequest } = await import('@/lib/middleware');
    const { validateAudioFile, validateNoteContent, sanitizeContent } = await import('@/lib/validation');
    const { withRateLimit } = await import('@/lib/rate-limiter');
    const { database } = await import('@/lib/database');

    vi.mocked(authenticateRequest).mockResolvedValue(mockUser);
    vi.mocked(validateAudioFile).mockReturnValue({ isValid: true });
    vi.mocked(validateNoteContent).mockReturnValue({ isValid: true });
    vi.mocked(sanitizeContent).mockImplementation((content) => content);
    vi.mocked(withRateLimit).mockReturnValue({ allowed: true, headers: {} });
    vi.mocked(database.execute).mockResolvedValue({
      rows: [],
      columns: [],
      columnTypes: [],
      rowsAffected: 1,
      lastInsertRowid: 1n,
      toJSON: () => ({})
    });
  });

  it('should complete full voice note flow: transcribe -> save -> retrieve', async () => {
    // Step 1: Transcribe audio
    const audioFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
    const transcribeFormData = new FormData();
    transcribeFormData.append('audio', audioFile);

    const transcribeRequest = {
      headers: {
        get: vi.fn().mockReturnValue('multipart/form-data'),
      },
      formData: vi.fn().mockResolvedValue(transcribeFormData),
    } as any;

    // Mock Groq transcription response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        text: 'This is a transcribed voice note about testing integration flows'
      })
    });

    const transcribeResponse = await transcribePost({ request: transcribeRequest } as any);
    const transcribeResult = await transcribeResponse.json();

    expect(transcribeResponse.status).toBe(200);
    expect(transcribeResult.success).toBe(true);
    expect(transcribeResult.transcription).toBe('This is a transcribed voice note about testing integration flows');

    // Step 2: Save transcribed content as note
    const saveRequest = {
      json: vi.fn().mockResolvedValue({ 
        content: transcribeResult.transcription 
      }),
    } as any;

    // Mock Groq API responses for title and tags generation
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Integration Testing Note' } }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'testing, integration, voice' } }]
        })
      });

    const saveResponse = await notesPost({ request: saveRequest } as any);
    const saveResult = await saveResponse.json();

    expect(saveResponse.status).toBe(201);
    expect(saveResult.success).toBe(true);
    expect(saveResult.note.title).toBe('Integration Testing Note');
    expect(saveResult.note.content).toBe('This is a transcribed voice note about testing integration flows');
    expect(saveResult.note.tags).toEqual(['testing', 'integration', 'voice']);

    // Step 3: Retrieve saved notes
    const mockUrl = {
      searchParams: new URLSearchParams()
    } as any;

    const retrieveRequest = {} as any;

    // Mock database response with the saved note
    const { database } = await import('@/lib/database');
    vi.mocked(database.execute)
      .mockResolvedValueOnce({
        rows: [{
          id: 'note-123',
          title: 'Integration Testing Note',
          content: 'This is a transcribed voice note about testing integration flows',
          tags: '["testing", "integration", "voice"]',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          length: 6
        }],
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

    const retrieveResponse = await notesGet({ request: retrieveRequest, url: mockUrl } as any);
    const retrieveResult = await retrieveResponse.json();

    expect(retrieveResponse.status).toBe(200);
    expect(retrieveResult.success).toBe(true);
    expect(retrieveResult.notes).toHaveLength(1);
    expect(retrieveResult.notes[0].title).toBe('Integration Testing Note');
    expect(retrieveResult.notes[0].content).toBe('This is a transcribed voice note about testing integration flows');
    expect(retrieveResult.notes[0].tags).toEqual(['testing', 'integration', 'voice']);
  });

  it('should handle errors gracefully in the flow', async () => {
    // Test transcription failure
    const audioFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
    const transcribeFormData = new FormData();
    transcribeFormData.append('audio', audioFile);

    const transcribeRequest = {
      headers: {
        get: vi.fn().mockReturnValue('multipart/form-data'),
      },
      formData: vi.fn().mockResolvedValue(transcribeFormData),
    } as any;

    // Mock Groq transcription failure
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error')
    });

    const transcribeResponse = await transcribePost({ request: transcribeRequest } as any);
    
    expect(transcribeResponse.status).toBe(502);

    // Test note saving with invalid content
    const { validateNoteContent } = await import('@/lib/validation');
    vi.mocked(validateNoteContent).mockReturnValue({ 
      isValid: false, 
      error: 'Content is required' 
    });

    const saveRequest = {
      json: vi.fn().mockResolvedValue({ content: '' }),
    } as any;

    const saveResponse = await notesPost({ request: saveRequest } as any);
    
    expect(saveResponse.status).toBe(400);
  });

  it('should handle rate limiting across the flow', async () => {
    const { withRateLimit } = await import('@/lib/rate-limiter');
    
    // Mock rate limit exceeded for transcription
    vi.mocked(withRateLimit).mockReturnValue({ 
      allowed: false, 
      headers: { 'X-RateLimit-Remaining': '0' } 
    });

    const audioFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
    const transcribeFormData = new FormData();
    transcribeFormData.append('audio', audioFile);

    const transcribeRequest = {
      headers: {
        get: vi.fn().mockReturnValue('multipart/form-data'),
      },
      formData: vi.fn().mockResolvedValue(transcribeFormData),
    } as any;

    const transcribeResponse = await transcribePost({ request: transcribeRequest } as any);
    
    expect(transcribeResponse.status).toBe(429);

    // Test rate limit for notes
    const saveRequest = {
      json: vi.fn().mockResolvedValue({ content: 'Test content' }),
    } as any;

    const saveResponse = await notesPost({ request: saveRequest } as any);
    
    expect(saveResponse.status).toBe(429);
  });
});