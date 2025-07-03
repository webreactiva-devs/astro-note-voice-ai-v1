import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// Mock global URL constructor
global.URL = class URL {
  public href: string;
  
  constructor(href: string, _base?: string) {
    this.href = href;
  }
  
  get searchParams() {
    const params = new URLSearchParams(this.href.split('?')[1] || '');
    return params;
  }
} as any;

// Mock global fetch
global.fetch = vi.fn();

// Mock window.MediaRecorder
global.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  state: 'inactive',
  stream: null,
  mimeType: '',
  audioBitsPerSecond: 0,
  videoBitsPerSecond: 0,
  requestData: vi.fn(),
}));

// Add static method to MediaRecorder
global.MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);

// Mock window.navigator.mediaDevices
Object.defineProperty(window, 'navigator', {
  value: {
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: vi.fn().mockReturnValue([]),
      }),
    },
  },
  writable: true,
});

// Mock window.URL
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
});

// Mock AudioContext
global.AudioContext = vi.fn().mockImplementation(() => ({
  createAnalyser: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    fftSize: 256,
    frequencyBinCount: 128,
    getByteFrequencyData: vi.fn(),
  }),
  createMediaStreamSource: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  state: 'running',
  suspend: vi.fn(),
  resume: vi.fn(),
  close: vi.fn(),
}));

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});