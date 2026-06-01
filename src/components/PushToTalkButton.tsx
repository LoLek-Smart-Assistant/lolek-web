import React, { useCallback, useEffect, useRef } from 'react';
import useVoiceRecognition from '../voice/useVoiceRecognition';
import type { ParsedVoiceResponse } from '../voice/types';

interface Props {
  // optional callback when a transcript/parsed response arrives
  onResult?: (transcript: string | null, parsed: ParsedVoiceResponse | null) => void;
}

export const PushToTalkButton: React.FC<Props> = ({ onResult }) => {
  const { isRecording, isLoading, transcript, parsedResponse, error, startRecording, stopRecording } =
    useVoiceRecognition();

  // Track the last response ID to prevent duplicate onResult calls
  const lastResponseIdRef = useRef<string | null>(null);

  const isEditableTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return Boolean(
      target.closest('input, textarea, select, [contenteditable="true"]'),
    );
  };

  // call onResult when transcript updates
  useEffect(() => {
    if (!onResult) {
      return;
    }

    if (transcript == null && parsedResponse == null) {
      lastResponseIdRef.current = null;
      return;
    }

    // Create a unique ID for this response
    const responseId = `${transcript}|${JSON.stringify(parsedResponse)}`;

    // Only call onResult if this is a new response
    if (lastResponseIdRef.current === responseId) {
      return;
    }

    lastResponseIdRef.current = responseId;
    onResult(transcript ?? null, parsedResponse ?? null);
  }, [transcript, parsedResponse, onResult]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat || isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();

      if (!isRecording && !isLoading) {
        void startRecording();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();

      if (isRecording) {
        void stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isLoading, isRecording, startRecording, stopRecording]);

  const handleStart = useCallback(async () => {
    await startRecording();
  }, [startRecording]);

  const handleStop = useCallback(async () => {
    await stopRecording();
  }, [stopRecording]);

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        aria-pressed={isRecording}
        aria-label={isRecording ? 'Recording' : isLoading ? 'Processing voice' : 'Push to talk'}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          void handleStart();
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          void handleStop();
        }}
        onPointerCancel={() => {
          void handleStop();
        }}
        onLostPointerCapture={() => {
          void handleStop();
        }}
        className="flex items-center justify-center w-16 h-16 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-gray-800 text-white"
      >
        {/* Loading state */}
        {isLoading ? (
          <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
          </svg>
        ) : isRecording ? (
          // recording state: red pulsing dot
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
            <span className="w-4 h-4 rounded-full bg-red-400 animate-pulse" />
          </div>
        ) : (
          // idle microphone icon
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1v11" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 11a7 7 0 01-14 0" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 21v-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="mt-2 text-center text-[11px] leading-4 text-slate-400">
        Hold <span className="font-semibold text-slate-200">Space</span> or press and hold the button to talk
      </div>

      {/* small status / error / transcript */}
      <div className="mt-2 text-center text-xs text-gray-300">
        {error ? <span className="text-red-400">{error}</span> : isRecording ? 'Recording…' : isLoading ? 'Processing…' : transcript ? transcript : 'Hold to talk'}
      </div>
    </div>
  );
};

export default PushToTalkButton;


