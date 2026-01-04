/**
 * ScribeLoop - Annotator Module
 * Selection & Highlighting logic
 * 
 * This is the core complexity of the application.
 * Uses absolute character offsets for annotation storage.
 */

/**
 * Calculate absolute offset of a selection relative to a root container
 * @param {Selection} selection
 * @param {HTMLElement} root
 * @returns {{ start: number, end: number, text: string } | null}
 */
export function getSelectionOffsets(selection, root) {
    if (!selection || selection.isCollapsed) return null;
    
    const range = selection.getRangeAt(0);
    
    // Create a range from the start of root to the selection start
    const preRange = document.createRange();
    preRange.setStart(root, 0);
    preRange.setEnd(range.startContainer, range.startOffset);
    
    // Normalize text content (consistent line breaks)
    const preText = normalizeText(preRange.toString());
    const selectedText = normalizeText(range.toString());
    
    return {
        start: preText.length,
        end: preText.length + selectedText.length,
        text: selectedText
    };
}

/**
 * Normalize text for consistent offset calculation
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Apply highlights to rendered content based on annotations
 * @param {Array} annotations - Array of annotation objects with start_offset, end_offset
 * @param {HTMLElement} container - The content container
 * @param {function} onHighlightClick - Callback when a highlight is clicked
 */
export function applyHighlights(annotations, container, onHighlightClick) {
    if (!annotations || annotations.length === 0) return;
    
    // Filter valid identifiers
    const validAnnotations = annotations.filter(a => 
        a.start_offset != null && a.end_offset != null && !a.parent_id
    );
    
    if (validAnnotations.length === 0) return;
    
    // Sort by start_offset (descending) so we modify end of document first?
    // Actually, with dynamic scanning, order matters less for correctness,
    // but processing from back to front is generally safer for DOM stability.
    validAnnotations.sort((a, b) => a.start_offset - b.start_offset);
    
    // Iterate backwards
    for (let i = validAnnotations.length - 1; i >= 0; i--) {
        const annotation = validAnnotations[i];
        const { start_offset, end_offset, id } = annotation;
        
        // Collect nodes to highlight first (to avoid modifying DOM while walking)
        const matches = [];
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
        let currentOffset = 0;
        let node;
        
        while (node = walker.nextNode()) {
            const text = normalizeText(node.textContent);
            const nodeStart = currentOffset;
            const nodeEnd = currentOffset + text.length;
            
            currentOffset += text.length;
            
            // Check overlap
            if (nodeEnd <= start_offset || nodeStart >= end_offset) {
                continue;
            }
            
            // Calculate local intersection
            const localStart = Math.max(0, start_offset - nodeStart);
            const localEnd = Math.min(text.length, end_offset - nodeStart);
            
            if (localStart < localEnd) {
                matches.push({
                    node,
                    localStart,
                    localEnd,
                    text: node.textContent // Use actual node content
                });
            }
        }
        
        // Apply highlights to collected matches
        for (const match of matches) {
            const { node, localStart, localEnd, text } = match;
            
            // Verify node is still attached (though collecting first minimizes this)
            if (!node.parentNode) continue;
            
            const beforeText = text.substring(0, localStart);
            const highlightText = text.substring(localStart, localEnd);
            const afterText = text.substring(localEnd);
            
            const mark = document.createElement('mark');
            mark.className = 'highlight';
            mark.dataset.annotationId = id;
            mark.textContent = highlightText;
            
            // Add click handler
            mark.addEventListener('click', (e) => {
                e.stopPropagation(); // Important for nested/overlapping
                onHighlightClick?.(annotation);
            });
            
            const frag = document.createDocumentFragment();
            if (beforeText) {
                frag.appendChild(document.createTextNode(beforeText));
            }
            frag.appendChild(mark);
            if (afterText) {
                frag.appendChild(document.createTextNode(afterText));
            }
            
            node.parentNode.replaceChild(frag, node);
        }
    }
}

/**
 * State for the annotator
 */
let currentSelection = null;
let currentChapterId = null;
let onAnnotationCreate = null;

/**
 * Initialize the annotator for a chapter
 * @param {HTMLElement} container - The chapter content container
 * @param {number} chapterId
 * @param {function} onCreate - Callback when annotation is created
 */
export function init(container, chapterId, onCreate) {
    currentChapterId = chapterId;
    onAnnotationCreate = onCreate;
    
    const contextMenu = document.getElementById('context-menu');
    const annotateBtn = document.getElementById('annotate-btn');
    const mobileFab = document.getElementById('mobile-fab');
    
    // Desktop: Listen for selection and context menu
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('contextmenu', handleContextMenu);
    
    // Mobile: Listen for selection changes
    document.addEventListener('selectionchange', handleSelectionChange);
    
    // Context menu action
    annotateBtn?.addEventListener('click', () => {
        if (currentSelection) {
            onAnnotationCreate?.(currentSelection);
            hideContextMenu();
        }
    });
    
    // Mobile FAB action
    mobileFab?.addEventListener('click', () => {
        if (currentSelection) {
            onAnnotationCreate?.(currentSelection);
            hideMobileFab();
        }
    });
    
    // Close context menu on click elsewhere
    document.addEventListener('click', (e) => {
        if (!contextMenu?.contains(e.target)) {
            hideContextMenu();
        }
    });
}

/**
 * Handle mouse up for selection detection
 */
function handleMouseUp(e) {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
        const container = document.getElementById('chapter-content');
        currentSelection = getSelectionOffsets(selection, container);
    }
}

/**
 * Handle right-click context menu
 */
function handleContextMenu(e) {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
        e.preventDefault();
        const container = document.getElementById('chapter-content');
        currentSelection = getSelectionOffsets(selection, container);
        
        if (currentSelection) {
            showContextMenu(e.clientX, e.clientY);
        }
    }
}

/**
 * Handle selection change (for mobile)
 */
let selectionTimeout = null;
function handleSelectionChange() {
    // Check if we're on mobile
    const isMobile = 'ontouchstart' in window;
    if (!isMobile) return;
    
    clearTimeout(selectionTimeout);
    
    selectionTimeout = setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
            const container = document.getElementById('chapter-content');
            currentSelection = getSelectionOffsets(selection, container);
            
            if (currentSelection) {
                showMobileFab();
            }
        } else {
            hideMobileFab();
        }
    }, 500); // Wait 500ms as per architecture spec
}

/**
 * Show context menu at position
 */
function showContextMenu(x, y) {
    const menu = document.getElementById('context-menu');
    if (menu) {
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.classList.remove('hidden');
    }
}

/**
 * Hide context menu
 */
function hideContextMenu() {
    const menu = document.getElementById('context-menu');
    menu?.classList.add('hidden');
}

/**
 * Show mobile FAB
 */
function showMobileFab() {
    const fab = document.getElementById('mobile-fab');
    fab?.classList.remove('hidden');
}

/**
 * Hide mobile FAB
 */
function hideMobileFab() {
    const fab = document.getElementById('mobile-fab');
    fab?.classList.add('hidden');
}

/**
 * Cleanup annotator event listeners
 */
export function destroy() {
    const container = document.getElementById('chapter-content');
    container?.removeEventListener('mouseup', handleMouseUp);
    container?.removeEventListener('contextmenu', handleContextMenu);
    document.removeEventListener('selectionchange', handleSelectionChange);
    currentSelection = null;
    currentChapterId = null;
    onAnnotationCreate = null;
}

export default { init, destroy, getSelectionOffsets, applyHighlights };
