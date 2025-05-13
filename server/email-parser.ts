import { log } from "./vite";

// Simple interface for parsed email
export interface ParsedEmail {
  from: {
    name: string;
    address: string;
  };
  to: string[];
  subject: string;
  text: string;
  html: string | null;
  headers: Record<string, any>;
  attachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

/**
 * Simple email parser to extract key information from email data
 */
export async function parseEmail(emailData: string): Promise<ParsedEmail> {
  try {
    const lines = emailData.split(/\r?\n/);
    const headers: Record<string, string> = {};
    const attachments: any[] = [];
    
    let i = 0;
    
    // Parse headers
    while (i < lines.length && lines[i] !== '') {
      const line = lines[i];
      
      if (line.match(/^\s/)) {
        // Continuation of previous header
        const lastHeader = Object.keys(headers).pop();
        if (lastHeader) {
          headers[lastHeader] += ' ' + line.trim();
        }
      } else {
        // New header
        const match = line.match(/^([^:]+):\s*(.*)$/);
        if (match) {
          const name = match[1].trim().toLowerCase();
          const value = match[2].trim();
          headers[name] = value;
        }
      }
      
      i++;
    }
    
    // Skip empty line after headers
    i++;
    
    // Find boundary if multipart
    let boundary = null;
    const contentType = headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary="?([^";\r\n]+)"?/i);
    
    if (boundaryMatch) {
      boundary = boundaryMatch[1];
    }
    
    let text = '';
    let html = null;
    
    // Parse body
    if (boundary) {
      // Multipart message
      const parts = emailData.split('--' + boundary);
      
      for (let part of parts) {
        if (part.includes('Content-Type: text/plain')) {
          const partLines = part.split(/\r?\n\r?\n/);
          if (partLines.length > 1) {
            text = partLines.slice(1).join('\n\n');
          }
        } else if (part.includes('Content-Type: text/html')) {
          const partLines = part.split(/\r?\n\r?\n/);
          if (partLines.length > 1) {
            html = partLines.slice(1).join('\n\n');
          }
        }
      }
    } else {
      // Single part message
      text = lines.slice(i).join('\n');
    }
    
    // Extract from name and address
    let fromName = '';
    let fromAddress = '';
    
    const from = headers['from'] || '';
    const fromMatch = from.match(/"?([^"<]+)"?\s*<?([^>]*)>?/);
    
    if (fromMatch) {
      fromName = fromMatch[1].trim();
      fromAddress = fromMatch[2].trim() || fromMatch[1].trim();
    } else {
      fromAddress = from;
    }
    
    // Extract to addresses
    const to: string[] = [];
    const toHeader = headers['to'] || '';
    const toAddresses = toHeader.split(',');
    
    for (let addr of toAddresses) {
      const toMatch = addr.match(/"?([^"<]+)"?\s*<?([^>]*)>?/);
      if (toMatch && toMatch[2]) {
        to.push(toMatch[2].trim());
      } else {
        to.push(addr.trim());
      }
    }
    
    return {
      from: {
        name: fromName,
        address: fromAddress
      },
      to,
      subject: headers['subject'] || '',
      text: text.trim(),
      html: html ? html.trim() : null,
      headers,
      attachments
    };
  } catch (error) {
    log(`Error parsing email: ${error}`);
    
    // Return a minimal valid object in case of parsing errors
    return {
      from: { name: '', address: '' },
      to: [],
      subject: '',
      text: '',
      html: null,
      headers: {},
      attachments: []
    };
  }
}

/**
 * Extract magic links from email text content
 */
export function extractMagicLinks(content: string): string[] {
  const urlRegex = /(https?:\/\/[^\s"<>]+)/g;
  const matches = content.match(urlRegex) || [];
  
  // Filter to likely magic links (containing tokens, auth, verify, etc.)
  return matches.filter(url => {
    const lowercaseUrl = url.toLowerCase();
    return (
      lowercaseUrl.includes('token=') ||
      lowercaseUrl.includes('verify') ||
      lowercaseUrl.includes('confirm') ||
      lowercaseUrl.includes('reset') ||
      lowercaseUrl.includes('auth') ||
      lowercaseUrl.includes('magic') ||
      lowercaseUrl.includes('login')
    );
  });
}
