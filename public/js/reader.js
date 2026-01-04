/**
 * ScribeLoop - Reader Module
 * Chapter rendering logic with markdown support
 */

import { chapters, annotations } from './firebase-api.js';

// We'll use a simple markdown renderer (server could also pre-render)
// For now, basic parsing - markdown-it is loaded on backend
function renderMarkdown(md) {
    // Basic markdown to HTML conversion
    // In production, this should come pre-rendered from the server
    // or use a client-side markdown-it
    return md
        // Headers
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold and italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        // Blockquotes
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        // Paragraphs
        .split(/\n\n+/)
        .map(p => {
            p = p.trim();
            if (!p) return '';
            if (p.startsWith('<h') || p.startsWith('<blockquote')) return p;
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        })
        .join('\n');
}

/**
 * Load and render a chapter
 * @param {number} chapterId
 * @param {HTMLElement} container
 */
export async function loadChapter(chapterId, container) {
    try {
        const chapter = await chapters.get(chapterId);
        const html = renderMarkdown(chapter.content_md);
        container.innerHTML = html;
        return chapter;
    } catch (error) {
        console.error('Error loading chapter:', error);
        container.innerHTML = `<p class="error">Erreur lors du chargement du chapitre.</p>`;
        throw error;
    }
}

/**
 * Load annotations for a chapter and create highlights
 * @param {number} chapterId 
 * @param {HTMLElement} container
 */
export async function loadAnnotations(chapterId, container) {
    try {
        const annotationList = await annotations.list(chapterId);
        
        // Sort by start_offset (descending) to insert from end to avoid offset shifts
        const rootAnnotations = annotationList
            .filter(a => a.start_offset != null && a.end_offset != null)
            .sort((a, b) => b.start_offset - a.start_offset);
        
        // Get text content
        const text = container.textContent;
        
        // Create highlighted HTML
        let html = container.innerHTML;
        
        // Apply highlights (this is simplified - proper implementation needs DOM traversal)
        // For MVP, we'll handle this when the annotator module is fully implemented
        
        return annotationList;
    } catch (error) {
        console.error('Error loading annotations:', error);
        return [];
    }
}

export default { loadChapter, loadAnnotations, renderMarkdown };
