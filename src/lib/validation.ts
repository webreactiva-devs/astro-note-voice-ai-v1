/**
 * Audio file validation utilities
 */

import { getMaxAudioFileSize } from './config';

// Allowed audio MIME types
const ALLOWED_AUDIO_TYPES = [
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp3'
] as const;

// Get maximum file size from configuration
function getMaxFileSize(): number {
  try {
    return getMaxAudioFileSize() * 1024 * 1024; // Convert MB to bytes
  } catch {
    // Fallback for tests or missing config
    return 10 * 1024 * 1024; // 10MB default
  }
}

// Maximum duration (2 minutes + buffer)
const MAX_DURATION_SECONDS = 130; // 2 minutes + 10 seconds buffer

export interface AudioValidationResult {
  isValid: boolean;
  error?: string;
  fileInfo?: {
    type: string;
    size: number;
    duration?: number;
  };
}

/**
 * Validates audio file type, size, and basic properties
 */
export function validateAudioFile(file: File): AudioValidationResult {
  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided'
    };
  }

  // Validate file size
  const maxSize = getMaxFileSize();
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size too large. Maximum allowed: ${maxSize / (1024 * 1024)}MB`
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File is empty'
    };
  }

  // Validate MIME type
  const fileType = file.type.split(';')[0]; // Remove codec info
  if (!ALLOWED_AUDIO_TYPES.some(type => type.startsWith(fileType))) {
    return {
      isValid: false,
      error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_AUDIO_TYPES.join(', ')}`
    };
  }

  return {
    isValid: true,
    fileInfo: {
      type: file.type,
      size: file.size
    }
  };
}

/**
 * Validates audio blob from FormData
 */
export function validateAudioBlob(blob: Blob): AudioValidationResult {
  // Check if blob exists
  if (!blob) {
    return {
      isValid: false,
      error: 'No audio data provided'
    };
  }

  // Validate blob size
  const maxSize = getMaxFileSize();
  if (blob.size > maxSize) {
    return {
      isValid: false,
      error: `Audio data too large. Maximum allowed: ${maxSize / (1024 * 1024)}MB`
    };
  }

  if (blob.size === 0) {
    return {
      isValid: false,
      error: 'Audio data is empty'
    };
  }

  // Validate MIME type
  const fileType = blob.type.split(';')[0]; // Remove codec info
  if (!ALLOWED_AUDIO_TYPES.some(type => type.startsWith(fileType))) {
    return {
      isValid: false,
      error: `Invalid audio type: ${blob.type}. Allowed types: ${ALLOWED_AUDIO_TYPES.join(', ')}`
    };
  }

  return {
    isValid: true,
    fileInfo: {
      type: blob.type,
      size: blob.size
    }
  };
}

/**
 * Validates text input for notes
 */
export function validateNoteContent(content: string): { isValid: boolean; error?: string } {
  if (!content || typeof content !== 'string') {
    return {
      isValid: false,
      error: 'Content is required'
    };
  }

  const trimmedContent = content.trim();
  
  if (trimmedContent.length === 0) {
    return {
      isValid: false,
      error: 'Content cannot be empty'
    };
  }

  if (trimmedContent.length > 50000) { // 50KB text limit
    return {
      isValid: false,
      error: 'Content too long. Maximum 50,000 characters allowed.'
    };
  }

  return { isValid: true };
}

/**
 * Sanitizes text content to prevent XSS
 */
export function sanitizeContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Basic HTML/script tag removal
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * Validates note ID format
 */
export function validateNoteId(id: string): { isValid: boolean; error?: string } {
  if (!id || typeof id !== 'string') {
    return {
      isValid: false,
      error: 'Invalid note ID'
    };
  }

  // Check for basic format (should be number or UUID-like)
  if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
    return {
      isValid: false,
      error: 'Invalid note ID format'
    };
  }

  return { isValid: true };
}