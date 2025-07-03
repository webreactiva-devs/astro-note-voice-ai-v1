// Database and application types

export interface Note {
  id: string;
  title: string;
  content: string;
  organizedContent?: string; // AI-processed content stored separately from transcription
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseNote extends Note {
  userId: string;
}