import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/pages/api/transcribe';

// Mock dependencies
vi.mock('@/lib/middleware', () => ({
  authenticateRequest: vi.fn(),
  createUnauthorizedResponse: vi.fn(() => new Response('Unauthorized', { status: 401 })),
  createBadRequestResponse: vi.fn((msg) => new Response(msg, { status: 400 })),
  createServerErrorResponse: vi.fn((msg) => new Response(msg, { status: 500 })),
}));

vi.mock('@/lib/validation', () => ({
  validateAudioFile: vi.fn(),
}));

vi.mock('@/lib/rate-limiter', () => ({
  withRateLimit: vi.fn(),
  RATE_LIMITS: {
    transcription: { windowMs: 60000, max: 5 }
  }
}));

// Environment variables are mocked in vitest.config.ts

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('/api/transcribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should transcribe audio file successfully', async () => {
    // Setup mocks
    const mockUser = { id: 'user123', email: 'test@example.com' };
    const mockAudioFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
    const mockFormData = new FormData();
    mockFormData.append('audio', mockAudioFile);

    const mockRequest = {
      headers: {
        get: vi.fn().mockReturnValue('multipart/form-data'),
      },
      formData: vi.fn().mockResolvedValue(mockFormData),
    } as any;

    const { authenticateRequest } = await import('@/lib/middleware');
    const { validateAudioFile } = await import('@/lib/validation');
    const { withRateLimit } = await import('@/lib/rate-limiter');

    vi.mocked(authenticateRequest).mockResolvedValue(mockUser);
    vi.mocked(validateAudioFile).mockReturnValue({ isValid: true });
    vi.mocked(withRateLimit).mockReturnValue({ 
      allowed: true, 
      headers: { 'X-RateLimit-Remaining': '4' } 
    });

    // Mock Groq API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        text: 'This is the transcribed text'
      })
    });

    const response = await POST({ request: mockRequest } as any);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.transcription).toBe('This is the transcribed text');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-groq-api-key',
        },
        body: expect.any(FormData),
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('should return 401 for unauthenticated requests', async () => {
    const mockRequest = {
      headers: {
        get: vi.fn().mockReturnValue('multipart/form-data'),
      },
      formData: vi.fn().mockResolvedValue(new FormData()),
    } as any;

    const { authenticateRequest } = await import('@/lib/middleware');
    vi.mocked(authenticateRequest).mockRejectedValue(new Error('Unauthorized'));

    const response = await POST({ request: mockRequest } as any);
    
    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid content type', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' };
    const mockRequest = {
      headers: {
        get: vi.fn().mockReturnValue('application/json'),
      },
    } as any;

    const { authenticateRequest } = await import('@/lib/middleware');
    const { withRateLimit } = await import('@/lib/rate-limiter');

    vi.mocked(authenticateRequest).mockResolvedValue(mockUser);
    vi.mocked(withRateLimit).mockReturnValue({ 
      allowed: true, 
      headers: {} 
    });

    const response = await POST({ request: mockRequest } as any);
    
    expect(response.status).toBe(400);
  });

  it('should return 400 for missing audio file', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' };
    const mockFormData = new FormData();
    // No audio file added to FormData

    const mockRequest = {
      headers: {
        get: vi.fn().mockReturnValue('multipart/form-data'),
      },
      formData: vi.fn().mockResolvedValue(mockFormData),
    } as any;

    const { authenticateRequest } = await import('@/lib/middleware');
    const { withRateLimit } = await import('@/lib/rate-limiter');

    vi.mocked(authenticateRequest).mockResolvedValue(mockUser);
    vi.mocked(withRateLimit).mockReturnValue({ 
      allowed: true, 
      headers: {} 
    });

    const response = await POST({ request: mockRequest } as any);
    
    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid audio file', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' };
    const mockAudioFile = new File(['invalid data'], 'test.txt', { type: 'text/plain' });
    const mockFormData = new FormData();
    mockFormData.append('audio', mockAudioFile);

    const mockRequest = {
      headers: {
        get: vi.fn().mockReturnValue('multipart/form-data'),
      },
      formData: vi.fn().mockResolvedValue(mockFormData),
    } as any;

    const { authenticateRequest } = await import('@/lib/middleware');
    const { validateAudioFile } = await import('@/lib/validation');
    const { withRateLimit } = await import('@/lib/rate-limiter');

    vi.mocked(authenticateRequest).mockResolvedValue(mockUser);
    vi.mocked(validateAudioFile).mockReturnValue({ 
      isValid: false, 
      error: 'Invalid file type' 
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
      headers: {
        get: vi.fn().mockReturnValue('multipart/form-data'),
      },
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

  it('should return 502 for Groq API errors', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' };
    const mockAudioFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
    const mockFormData = new FormData();
    mockFormData.append('audio', mockAudioFile);

    const mockRequest = {
      headers: {
        get: vi.fn().mockReturnValue('multipart/form-data'),
      },
      formData: vi.fn().mockResolvedValue(mockFormData),
    } as any;

    const { authenticateRequest } = await import('@/lib/middleware');
    const { validateAudioFile } = await import('@/lib/validation');
    const { withRateLimit } = await import('@/lib/rate-limiter');

    vi.mocked(authenticateRequest).mockResolvedValue(mockUser);
    vi.mocked(validateAudioFile).mockReturnValue({ isValid: true });
    vi.mocked(withRateLimit).mockReturnValue({ 
      allowed: true, 
      headers: {} 
    });

    // Mock Groq API error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error')
    });

    const response = await POST({ request: mockRequest } as any);
    
    expect(response.status).toBe(502);
  });

  it('should return 408 for timeout', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' };
    const mockAudioFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
    const mockFormData = new FormData();
    mockFormData.append('audio', mockAudioFile);

    const mockRequest = {
      headers: {
        get: vi.fn().mockReturnValue('multipart/form-data'),
      },
      formData: vi.fn().mockResolvedValue(mockFormData),
    } as any;

    const { authenticateRequest } = await import('@/lib/middleware');
    const { validateAudioFile } = await import('@/lib/validation');
    const { withRateLimit } = await import('@/lib/rate-limiter');

    vi.mocked(authenticateRequest).mockResolvedValue(mockUser);
    vi.mocked(validateAudioFile).mockReturnValue({ isValid: true });
    vi.mocked(withRateLimit).mockReturnValue({ 
      allowed: true, 
      headers: {} 
    });

    // Mock timeout error
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const response = await POST({ request: mockRequest } as any);
    
    expect(response.status).toBe(408);
  });

  it('should return 422 for empty transcription', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' };
    const mockAudioFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
    const mockFormData = new FormData();
    mockFormData.append('audio', mockAudioFile);

    const mockRequest = {
      headers: {
        get: vi.fn().mockReturnValue('multipart/form-data'),
      },
      formData: vi.fn().mockResolvedValue(mockFormData),
    } as any;

    const { authenticateRequest } = await import('@/lib/middleware');
    const { validateAudioFile } = await import('@/lib/validation');
    const { withRateLimit } = await import('@/lib/rate-limiter');

    vi.mocked(authenticateRequest).mockResolvedValue(mockUser);
    vi.mocked(validateAudioFile).mockReturnValue({ isValid: true });
    vi.mocked(withRateLimit).mockReturnValue({ 
      allowed: true, 
      headers: {} 
    });

    // Mock empty transcription
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        text: ''
      })
    });

    const response = await POST({ request: mockRequest } as any);
    
    expect(response.status).toBe(422);
  });
});