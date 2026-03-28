import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

export interface ParsedTemplate {
  rawText: string;
  sections: string[];
}

export async function parsePdf(filePath: string): Promise<ParsedTemplate> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const rawText = data.text.trim();
  const sections = extractSections(rawText);
  return { rawText, sections };
}

/**
 * Extracts section headings from PDF text.
 * Looks for lines that are ALL CAPS, Title Case numbered, or start with common heading patterns.
 */
function extractSections(text: string): string[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const sections: string[] = [];

  for (const line of lines) {
    if (
      // Numbered section: 1. Introduction, 2.1 Scope, etc.
      /^\d+(\.\d+)*[\.\)]\s+\S/.test(line) ||
      // ALL CAPS line (likely a heading), min 4 chars
      (line === line.toUpperCase() && line.length >= 4 && /[A-Z]/.test(line)) ||
      // Common QA test plan heading keywords
      /^(test (plan|scope|strategy|cases?|environment|objectives?|approach)|introduction|overview|scope|assumptions?|risks?|entry|exit criteria|schedule|resources?|deliverables?|sign.?off)/i.test(line)
    ) {
      sections.push(line);
    }
  }

  return [...new Set(sections)]; // deduplicate
}

export function moveTmpToTemplates(tmpPath: string, destDir: string, filename: string): string {
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, filename);
  fs.renameSync(tmpPath, destPath);
  return destPath;
}
