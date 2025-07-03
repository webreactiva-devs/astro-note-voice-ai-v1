-- Migration: Add organizedContent field to notes table
-- Created: 2025-07-03
-- Description: Adds organizedContent field to store AI-processed content separately from transcription

-- This migration adds a new column to the existing notes table to store AI-processed content separately from the original transcription.
ALTER TABLE notes ADD COLUMN organizedContent TEXT NOT NULL DEFAULT '';
