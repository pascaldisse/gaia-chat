import * as pdfjsLib from 'pdfjs-dist';

// Initialize worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export const base64ToArrayBuffer = (base64) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const parseFileContent = async (content, mimeType, fileName) => {
  try {
    const extension = fileName.split('.').pop().toLowerCase();
    const arrayBuffer = content instanceof ArrayBuffer ? content : base64ToArrayBuffer(content);

    // Handle PDF files
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      
      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }
      
      return text;
    }

    // Handle text-based files
    if (mimeType.startsWith('text/') || 
        ['txt', 'csv', 'md', 'html'].includes(extension)) {
      return new TextDecoder().decode(arrayBuffer);
    }

    // Handle Office documents (basic text extraction)
    if (['doc', 'docx', 'xls', 'xlsx'].includes(extension)) {
      // For production use a proper library like mammoth or exceljs
      return '[Office document content - text extraction limited]';
    }

    return '[File content not extractable]';
  } catch (error) {
    console.error('Error parsing file:', error);
    return '[Error parsing file content]';
  }
};