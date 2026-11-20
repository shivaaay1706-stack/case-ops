/**
 * WhatsApp Chat Export Parser
 * Parses standard WhatsApp export format:
 *   [DD/MM/YY, HH:MM:SS] Sender: Message
 *   [DD/MM/YYYY, HH:MM:SS] Sender: Message
 * Handles multi-line messages (continuation lines without a leading timestamp).
 */
export interface ChatMessage {
  timestamp: string; // normalized ISO
  sender: string;
  text: string;
  lineNumber: number;
}

const TIMESTAMP_RE = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}:\d{2}(?::\d{2})?)\]\s*([^:]+?):\s?(.*)$/;

export function parseWhatsAppExport(rawText: string): ChatMessage[] {
  const lines = rawText.split(/\r?\n/);
  const messages: ChatMessage[] = [];
  let current: ChatMessage | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(TIMESTAMP_RE);
    if (match) {
      const [, dmy, time, sender, text] = match;
      const iso = normalizeDate(dmy, time);
      current = {
        timestamp: iso,
        sender: sender.trim(),
        text: text.trim(),
        lineNumber: i + 1,
      };
      messages.push(current);
    } else if (current && line.trim()) {
      // continuation of previous message
      current.text += '\n' + line.trim();
    }
  }
  return messages;
}

function normalizeDate(dmy: string, time: string): string {
  const parts = dmy.split('/');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);
  if (year < 100) year += 2000;
  const tParts = time.split(':');
  const hh = parseInt(tParts[0], 10);
  const mm = parseInt(tParts[1], 10);
  const ss = parseInt(tParts[2] || '0', 10);
  const dt = new Date(Date.UTC(year, month - 1, day, hh, mm, ss));
  return dt.toISOString();
}

export function messagesToEvidence(messages: ChatMessage[], evidenceId: string, fileName: string): string {
  return messages
    .map((m) => `[${m.timestamp}] ${m.sender}: ${m.text}`)
    .join('\n');
}
