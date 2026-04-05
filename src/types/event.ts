export type EventCategory = 'Seminar' | 'Workshop' | 'Hackathon' | 'Coding Challenge';

export interface EventData {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  category: EventCategory;
  poster_url: string;
  description?: string;
  created_at: string;
  raw_text?: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface ExtractedEventData {
  name: string;
  date: string;
  time: string;
  venue: string;
  category: EventCategory;
}

export interface UploadStatus {
  step: 'idle' | 'uploading' | 'ocr' | 'nlp' | 'classifying' | 'saving' | 'done' | 'error';
  progress: number;
  message: string;
}
