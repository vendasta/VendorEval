import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

/**
 * Extract text from a File object.
 * Supports: .pdf, .docx, .doc, .txt
 */
export async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'txt' || ext === 'text' || ext === 'csv') {
    return await file.text();
  }

  if (ext === 'pdf') {
    return await extractFromPDF(file);
  }

  if (ext === 'docx' || ext === 'doc') {
    return await extractFromDocx(file);
  }

  throw new Error(`Unsupported file type: .${ext}. Use PDF, DOCX, or TXT.`);
}

async function extractFromPDF(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(' ');
    pages.push(text);
  }

  return pages.join('\n\n');
}

async function extractFromDocx(file) {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

export const ACCEPTED_FILE_TYPES = '.pdf,.docx,.doc,.txt,.text';
