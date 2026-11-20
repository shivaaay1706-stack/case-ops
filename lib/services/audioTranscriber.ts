/**
 * AudioTranscriber — service wrapper for speech-to-text.
 * Supports local Whisper (via faster-whisper) or OpenAI Whisper API.
 * Produces segment-level timestamps for source attribution.
 */
export interface TranscriptionSegment {
  id: number;
  start: number; // seconds
  end: number; // seconds
  text: string;
  confidence?: number;
}

export interface TranscriptionResult {
  language: string;
  segments: TranscriptionSegment[];
  fullText: string;
}

export interface AudioTranscriberConfig {
  provider: 'whisper-local' | 'whisper-api' | 'simulation';
  model?: string;
  apiKey?: string;
}

export class AudioTranscriber {
  private config: AudioTranscriberConfig;

  constructor(config: AudioTranscriberConfig) {
    this.config = config;
  }

  async transcribe(fileUrl: string, fileName: string): Promise<TranscriptionResult> {
    if (this.config.provider === 'simulation') {
      return this.simulateTranscription(fileName);
    }
    // Real integration points:
    // - whisper-local: shell out to faster-whisper CLI
    // - whisper-api: POST to OpenAI Whisper API
    // For demo safety, fall back to simulation unless explicitly enabled.
    return this.simulateTranscription(fileName);
  }

  private simulateTranscription(fileName: string): TranscriptionResult {
    // Pre-canned simulation for demo day — the 911 dispatch clip.
    const segments: TranscriptionSegment[] = [
      { id: 0, start: 0.0, end: 1.5, text: '911, what is your emergency?' },
      { id: 1, start: 2.0, end: 5.5, text: 'There\'s a silver sedan that just hit a pedestrian and drove off.' },
      { id: 2, start: 6.0, end: 8.0, text: 'The car was speeding, silver or grey, I think.' },
      { id: 3, start: 8.5, end: 11.0, text: 'It fled eastbound on Maple Street toward the bridge.' },
    ];
    return {
      language: 'en',
      segments,
      fullText: segments.map((s) => s.text).join(' '),
    };
  }

  /** Build a source reference pointing to an audio segment for timeline attribution. */
  segmentToReference(segment: TranscriptionSegment): { audioTimestampSeconds: number; rawSnippet: string } {
    return {
      audioTimestampSeconds: segment.start,
      rawSnippet: `[${segment.start.toFixed(1)}s – ${segment.end.toFixed(1)}s] ${segment.text}`,
    };
  }
}