import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set the worker source for pdf.js to ensure it runs correctly in the browser environment.
// This is crucial for parsing PDF files on the client-side without freezing the UI.
// FIX: Replaced dynamic URL construction with a static, reliable CDN link to prevent crashes.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/build/pdf.worker.min.mjs';

/**
 * Parses a PDF file and extracts its text content.
 * @param file The PDF file to parse.
 * @returns A promise that resolves with the extracted text.
 */
const parsePdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const numPages = pdf.numPages;
  let textContent = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    textContent += content.items.map((item: any) => item.str).join(' ');
  }

  return textContent;
};

/**
 * Parses a .docx file and extracts its text content.
 * @param file The .docx file to parse.
 * @returns A promise that resolves with the extracted text.
 */
const parseDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

/**
 * Parses a .txt file and reads its content.
 * @param file The .txt file to parse.
 * @returns A promise that resolves with the file's text content.
 */
const parseTxt = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

/**
 * Extracts text from a file based on its MIME type.
 * Supports PDF, DOCX, and plain text files.
 * @param file The file to extract text from.
 * @returns A promise that resolves with the extracted text content.
 * @throws An error if the file type is unsupported.
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
  if (file.type === 'application/pdf') {
    return parsePdf(file);
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return parseDocx(file);
  } else if (file.type === 'text/plain') {
    return parseTxt(file);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
  }
};
