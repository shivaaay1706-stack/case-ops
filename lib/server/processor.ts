import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';
import { parseWhatsAppExport } from '../services/whatsappParser';
import { getServerConfig } from './config';

const execFileAsync = promisify(execFile);

export type ProcessableEvidence = 'pdf' | 'scanned_image' | 'whatsapp' | 'audio';

export async function extractEvidenceText(type: ProcessableEvidence, fileName: string, buffer: Buffer) {
  const config = getServerConfig();
  const workDir = await mkdtemp(join(tmpdir(), 'case-ops-'));
  const inputPath = join(workDir, basename(fileName));
  await writeFile(inputPath, buffer);

  try {
    if (type === 'whatsapp') {
      const raw = buffer.toString('utf8');
      const messages = parseWhatsAppExport(raw);
      if (messages.length === 0) throw new Error('The WhatsApp export did not match the supported format.');
      return messages.map((message) => `[${message.timestamp}] ${message.sender}: ${message.text}`).join('\n');
    }

    if (type === 'scanned_image') {
      const outputBase = join(workDir, 'ocr');
      await execFileAsync(config.TESSERACT_COMMAND, [inputPath, outputBase, 'txt'], { timeout: 120_000 });
      return (await readFile(`${outputBase}.txt`, 'utf8')).trim();
    }

    if (type === 'pdf') {
      const outputPath = join(workDir, 'document.txt');
      await execFileAsync(config.PDFTOTEXT_COMMAND, [inputPath, outputPath], { timeout: 120_000 });
      return (await readFile(outputPath, 'utf8')).trim();
    }

    const outputDir = join(workDir, 'transcription');
    await mkdir(outputDir);
    await execFileAsync(config.WHISPER_COMMAND, [
      inputPath,
      '--model',
      config.WHISPER_MODEL,
      '--output_format',
      'txt',
      '--output_dir',
      outputDir,
    ], { timeout: 15 * 60_000 });
    return (await readFile(join(outputDir, `${basename(fileName).replace(/\.[^.]+$/, '')}.txt`), 'utf8')).trim();
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
