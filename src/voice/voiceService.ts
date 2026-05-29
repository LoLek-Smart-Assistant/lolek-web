import axiosInstance from '../config/axiosConfig';
import type { VoiceResponse } from './types';

// Upload audio blob to backend /voice/transcribe endpoint
// Returns parsed and transcript response from backend
export async function uploadVoiceAudio(audioBlob: Blob): Promise<VoiceResponse> {
  const form = new FormData();
  // backend expects a file field named "file"; adjust if backend uses different key
  form.append('file', audioBlob, 'voice.webm');

  const response = await axiosInstance.post<VoiceResponse>('/voice/transcribe', form, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const data = response.data;

  if (!data || typeof data.transcript !== 'string' || !data.parsed) {
    return Promise.reject(new Error('Invalid response from voice transcription endpoint'));
  }

  return data as VoiceResponse;
}

