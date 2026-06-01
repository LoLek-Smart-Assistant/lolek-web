import { useEffect, useRef, useState } from 'react';
import type { ParsedVoiceResponse, UseVoiceRecognitionState, VoiceResponse } from './types';
import { uploadVoiceAudio } from './voiceService';

export function useVoiceRecognition(): UseVoiceRecognitionState {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [parsedResponse, setParsedResponse] = useState<ParsedVoiceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);
  const isLoadingRef = useRef(false);
  const isStoppingRef = useRef(false);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          try {
              mediaRecorderRef.current.stop();
            } catch {
              // ignore
            }
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  async function startRecording(): Promise<void> {
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Media devices API not supported in this browser');
      return;
    }

    if (isRecordingRef.current || isLoadingRef.current) return;

    isRecordingRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // prefer audio/webm for Chromium-based browsers
      const options: MediaRecorderOptions = { mimeType: 'audio/webm' };
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorder.onerror = (ev) => {
        // record error
        setError(`Recording error: ${ev}`);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err: unknown) {
      isRecordingRef.current = false;
      const message = err instanceof Error ? err.message : String(err);
      setError(message.startsWith('NotAllowedError') ? 'Microphone permission denied' : message);
    }
  }

  async function stopRecording(): Promise<void> {
    if (isStoppingRef.current) {
      return;
    }

    isStoppingRef.current = true;

    if (!mediaRecorderRef.current) {
      setIsRecording(false);
      isRecordingRef.current = false;
      isStoppingRef.current = false;
      return;
    }

    const recorder = mediaRecorderRef.current;

    // create a promise that resolves when recorder stops
    const stopped = new Promise<Blob | null>((resolve) => {
      const cleanupAndResolve = () => {
        // stop tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }

        mediaRecorderRef.current = null;
      };

      recorder.onstop = () => {
        try {
          const blob = chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: 'audio/webm' }) : null;
          // clear chunks
          chunksRef.current = [];
          cleanupAndResolve();
          resolve(blob);
        } catch {
          cleanupAndResolve();
          resolve(null);
        }
      };
    });

    try {
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    } catch {
      // ignore
    }

    setIsRecording(false);
    isRecordingRef.current = false;

    const blob = await stopped;
    if (!blob) {
      setError('No audio data recorded');
      isStoppingRef.current = false;
      return;
    }

    if (blob.size < 500) {
      setError('Recording too short');
      isStoppingRef.current = false;
      return;
    }

    setIsLoading(true);
    isLoadingRef.current = true;
    setError(null);
    try {
      const res: VoiceResponse = await uploadVoiceAudio(blob);
      // Log the transcript and parsed response so developers can inspect what the backend returned
      // This answers the request to "log what i get from the transcribed audio".
      // You can remove or change this to a different logging/reporting mechanism if desired.
      console.log('[voice] transcript:', res.transcript);
      console.log('[voice] parsed response:', res.parsed);

      setTranscript(res.transcript ?? null);
      setParsedResponse(res.parsed ?? null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message ?? 'Failed to upload audio');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
      isStoppingRef.current = false;
    }
  }

  return {
    isRecording,
    isLoading,
    transcript,
    parsedResponse,
    error,
    startRecording,
    stopRecording,
  };
}

export default useVoiceRecognition;

