-- Migration: Create notes table
-- Created: 2025-07-02
-- Description: Creates the notes table for storing voice note transcriptions with user relationship

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- Create index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_notes_userId ON notes(userId);

-- Create index for faster queries by creation date
CREATE INDEX IF NOT EXISTS idx_notes_createdAt ON notes(createdAt DESC);

-- Create index for text search on title and content
CREATE INDEX IF NOT EXISTS idx_notes_search ON notes(title, content);