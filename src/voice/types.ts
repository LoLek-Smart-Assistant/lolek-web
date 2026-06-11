// ...types for voice recognition feature
export interface ParsedVoiceResponse {
  intent: string;

  champion?: string;

  items?: string[];
}

export interface VoiceResponse {
  transcript: string;

  parsed: ParsedVoiceResponse;
}

// Hook state / status types
export type RecordingStatus = 'idle' | 'recording' | 'loading' | 'error';

export interface UseVoiceRecognitionState {
  isRecording: boolean;
  isLoading: boolean;
  transcript?: string | null;
  parsedResponse?: ParsedVoiceResponse | null;
  error?: string | null;

  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
}

