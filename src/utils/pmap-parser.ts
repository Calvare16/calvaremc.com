/**
 * PMAP Parser - Simple templating language for non-coders
 * Parses .pmap files into structured data
 */

export interface PmapSection {
  type: 'text' | 'heading' | 'list' | 'image' | 'link';
  content: string;
  level?: number; // for headings
  items?: string[]; // for lists
  url?: string; // for images and links
  alt?: string; // for images
}

export interface PmapData {
  title?: string;
  description?: string;
  sections: PmapSection[];
}

/**
 * Parse a .pmap file content into structured data
 */
export function parsePmap(content: string): PmapData {
  const lines = content.split('\n');
  const result: PmapData = {
    sections: []
  };

  let currentList: string[] | null = null;
  let inMetadata = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      // End current list if any
      if (currentList) {
        result.sections.push({
          type: 'list',
          content: '',
          items: currentList
        });
        currentList = null;
      }
      continue;
    }

    // Metadata section (at the top of file)
    if (trimmed === '---' && i === 0) {
      inMetadata = true;
      continue;
    }
    if (trimmed === '---' && inMetadata) {
      inMetadata = false;
      continue;
    }

    // Parse metadata
    if (inMetadata) {
      if (trimmed.startsWith('title:')) {
        result.title = trimmed.substring(6).trim();
      } else if (trimmed.startsWith('description:')) {
        result.description = trimmed.substring(12).trim();
      }
      continue;
    }

    // Headings (# = h1, ## = h2, etc.)
    if (trimmed.startsWith('#')) {
      if (currentList) {
        result.sections.push({
          type: 'list',
          content: '',
          items: currentList
        });
        currentList = null;
      }

      const level = trimmed.match(/^#+/)?.[0].length || 1;
      const content = trimmed.substring(level).trim();
      result.sections.push({
        type: 'heading',
        content,
        level
      });
      continue;
    }

    // Images [image: url | alt text]
    if (trimmed.startsWith('[image:')) {
      if (currentList) {
        result.sections.push({
          type: 'list',
          content: '',
          items: currentList
        });
        currentList = null;
      }

      const match = trimmed.match(/\[image:\s*([^\|]+)\s*(?:\|\s*(.+))?\]/);
      if (match) {
        result.sections.push({
          type: 'image',
          content: '',
          url: match[1].trim(),
          alt: match[2]?.trim() || ''
        });
      }
      continue;
    }

    // List items (- item)
    if (trimmed.startsWith('-')) {
      const item = trimmed.substring(1).trim();
      if (!currentList) {
        currentList = [];
      }
      currentList.push(item);
      continue;
    }

    // Regular text paragraphs
    if (currentList) {
      result.sections.push({
        type: 'list',
        content: '',
        items: currentList
      });
      currentList = null;
    }

    result.sections.push({
      type: 'text',
      content: trimmed
    });
  }

  // Add remaining list if any
  if (currentList) {
    result.sections.push({
      type: 'list',
      content: '',
      items: currentList
    });
  }

  return result;
}

/**
 * Process inline markdown-style syntax in text
 * Supports: **bold**, [text](url), emoji shortcuts
 */
export function processInlineMarkup(text: string): string {
  // Bold text **text**
  text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
  
  // Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  return text;
}
