/**
 * ScribeLoop - Main Application Entry Point
 * Router logic and view management
 */

import { chapters, annotations, users, metadata, verifyAdmin } from './firebase-api.js';
import { loadChapter, loadAnnotations } from './reader.js';
import annotator, { applyHighlights } from './annotator.js';

// DOM Elements
const views = {
    landing: document.getElementById('landing'),
    dashboard: document.getElementById('dashboard'),
    reader: document.getElementById('reader'),
    admin: document.getElementById('admin'),
};

const elements = {
    pseudoForm: document.getElementById('pseudo-form'),
    pseudoInput: document.getElementById('pseudo-input'),
    passwordInput: document.getElementById('password-input'),
    startBtn: document.getElementById('start-btn'),
    userPseudo: document.getElementById('user-pseudo'),
    bookTitle: document.getElementById('book-title'),
    chaptersAwaiting: document.getElementById('chapters-awaiting'),
    chaptersValidated: document.getElementById('chapters-validated'),
    chaptersPlanned: document.getElementById('chapters-planned'),
    backBtn: document.getElementById('back-btn'),
    chapterTitleNav: document.getElementById('chapter-title-nav'),
    chapterContent: document.getElementById('chapter-content'),
    annotationSidebar: document.getElementById('annotation-sidebar'),
    closeSidebar: document.getElementById('close-sidebar'),
    selectedTextQuote: document.getElementById('selected-text-quote'),
    annotationThread: document.getElementById('annotation-thread'),
    annotationForm: document.getElementById('annotation-form'),
    commentInput: document.getElementById('comment-input'),
    logoutBtn: document.getElementById('logout-btn'),
};

// State
let currentPseudo = localStorage.getItem('scribeloop_pseudo') || '';
let currentChapterId = null;
let currentAnnotations = [];
let adminToken = localStorage.getItem('scribeloop_admin_token') || '';
let editingChapterId = null;

/**
 * Initialize the application
 */
function init() {
    setupEventListeners();
    setupAdminListeners();
    
    // Listen for hash changes (navigation to #admin)
    window.addEventListener('hashchange', handleHashChange);
    
    handleHashChange();
}

/**
 * Handle URL hash changes for routing
 */
function handleHashChange() {
    // Check URL hash for admin route
    if (window.location.hash === '#admin') {
        if (adminToken) {
            showView('admin');
            loadAdmin();
        } else {
            promptAdminLogin();
        }
        return;
    }
    
    // Check if user already has a pseudo
    if (currentPseudo) {
        showView('dashboard');
        loadDashboard();
    } else {
        showView('landing');
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Pseudo & Password input validation
    const validateForm = () => {
        const pseudoValid = elements.pseudoInput.value.trim().length >= 3;
        const passwordValid = elements.passwordInput.value.length >= 4; // Minimum 4 pour le MVP
        elements.startBtn.disabled = !(pseudoValid && passwordValid);
    };
    elements.pseudoInput?.addEventListener('input', validateForm);
    elements.passwordInput?.addEventListener('input', validateForm);
    
    // Pseudo form submission (Login / Register)
    elements.pseudoForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pseudo = elements.pseudoInput.value.trim();
        const password = elements.passwordInput.value;
        
        const originalBtnText = elements.startBtn.textContent;
        elements.startBtn.disabled = true;
        elements.startBtn.textContent = 'Connexion...';

        try {
            const result = await users.login(pseudo, password);
            
            currentPseudo = result.pseudo;
            localStorage.setItem('scribeloop_pseudo', currentPseudo);
            
            showView('dashboard');
            loadDashboard();
        } catch (error) {
            alert('❌ ' + error.message);
            elements.passwordInput.value = '';
            elements.startBtn.textContent = originalBtnText;
            elements.startBtn.disabled = false;
        }
    });
    
    // Back button
    elements.backBtn?.addEventListener('click', () => {
        annotator.destroy();
        showView('dashboard');
    });
    
    // Close sidebar
    elements.closeSidebar?.addEventListener('click', () => {
        closeSidebar();
    });
    
    // Annotation form
    elements.annotationForm?.addEventListener('submit', handleAnnotationSubmit);

    // Annotation actions (delegation)
    elements.annotationThread?.addEventListener('click', handleAnnotationAction);

    // Logout button
    elements.logoutBtn?.addEventListener('click', () => {
        currentPseudo = '';
        localStorage.removeItem('scribeloop_pseudo');
        showView('landing');
        elements.pseudoForm.reset();
        elements.passwordInput.value = '';
    });
}

/**
 * Show a specific view
 */
function showView(viewName) {
    Object.values(views).forEach(view => view?.classList.remove('active'));
    views[viewName]?.classList.add('active');
}

/**
 * Load dashboard data
 */
async function loadDashboard() {
    elements.userPseudo.textContent = currentPseudo;
    
    try {
        // Load metadata first
        const meta = await metadata.get();
        elements.bookTitle.textContent = meta.book_title;
        
        // Update progress bar if it exists
        updateProgressBar(meta);
        
        // Load chapters
        const chapterList = await chapters.list();
        
        // Dynamic count of published chapters (validated + awaiting_feedback)
        const publishedCount = chapterList.filter(c => 
            c.status === 'validated' || c.status === 'awaiting_feedback'
        ).length;
        
        meta.published_chapters = publishedCount;
        
        // Update progress bar
        updateProgressBar(meta);
        
        // Clear lists
        elements.chaptersAwaiting.innerHTML = '';
        elements.chaptersValidated.innerHTML = '';
        elements.chaptersPlanned.innerHTML = '';
        
        // Sort and populate
        chapterList.forEach(chapter => {
            const li = createChapterItem(chapter);
            
            switch (chapter.status) {
                case 'awaiting_feedback':
                    elements.chaptersAwaiting.appendChild(li);
                    break;
                case 'validated':
                    elements.chaptersValidated.appendChild(li);
                    break;
                case 'planned':
                    elements.chaptersPlanned.appendChild(li);
                    break;
            }
        });
        
        // Show empty state if needed
        if (elements.chaptersAwaiting.children.length === 0) {
            elements.chaptersAwaiting.innerHTML = '<li class="empty-state">Aucun chapitre en attente de feedback</li>';
        }
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

/**
 * Update progress bar with metadata
 */
function updateProgressBar(meta) {
    const progressContainer = document.getElementById('progress-container');
    if (!progressContainer) return;
    
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    if (progressBar) {
        progressBar.style.width = `${meta.progress_percent}%`;
    }
    if (progressText) {
        progressText.textContent = `${meta.published_chapters}/${meta.total_chapters} chapitres publiés`;
    }
}

/**
 * Create a chapter list item
 */
function createChapterItem(chapter) {
    const li = document.createElement('li');
    li.className = 'chapter-item';
    
    if (chapter.status === 'planned') {
        li.classList.add('disabled');
    }
    
    li.innerHTML = `
        <span class="chapter-title">${chapter.title}</span>
        <span class="chapter-meta">${getStatusBadge(chapter.status)}</span>
    `;
    
    if (chapter.status !== 'planned') {
        li.addEventListener('click', () => openChapter(chapter.id));
    }
    
    return li;
}

/**
 * Get status badge
 */
function getStatusBadge(status) {
    switch (status) {
        case 'awaiting_feedback': return '📖 Ouvert';
        case 'validated': return '🔒 Validé';
        case 'planned': return '📝 Prévu';
        default: return '';
    }
}

/**
 * Open a chapter for reading
 */
async function openChapter(chapterId) {
    currentChapterId = chapterId;
    showView('reader');
    
    try {
        const chapter = await loadChapter(chapterId, elements.chapterContent);
        elements.chapterTitleNav.textContent = chapter.title;
        
        // Show lock indicator for validated chapters
        const isLocked = chapter.status === 'validated';
        updateChapterLockStatus(isLocked);
        
        // Load annotations
        currentAnnotations = await loadAnnotations(chapterId, elements.chapterContent);
        
        // Apply highlights to the rendered content
        applyHighlights(currentAnnotations, elements.chapterContent, handleHighlightClick);
        
        // Initialize annotator only if chapter is open for feedback
        if (chapter.status === 'awaiting_feedback') {
            annotator.init(elements.chapterContent, chapterId, handleNewAnnotation);
        }
        
    } catch (error) {
        console.error('Error opening chapter:', error);
    }
}

/**
 * Update chapter lock status in UI
 */
function updateChapterLockStatus(isLocked) {
    const readerNav = document.querySelector('.reader-nav');
    
    // Remove existing lock indicator
    document.getElementById('lock-indicator')?.remove();
    
    if (isLocked) {
        // Add lock indicator
        const indicator = document.createElement('span');
        indicator.id = 'lock-indicator';
        indicator.className = 'lock-indicator';
        indicator.textContent = '🔒 Validé';
        readerNav?.appendChild(indicator);
        
        // Hide annotation form
        elements.annotationForm?.classList.add('hidden');
    } else {
        elements.annotationForm?.classList.remove('hidden');
    }
}

/**
 * Handle click on existing highlight
 * Shows the annotation thread in sidebar
 */
function handleHighlightClick(annotation) {
    if (!annotation) return;
    
    // Find all replies to this annotation (from currentAnnotations)
    const thread = buildAnnotationThread(annotation.id);
    
    // Display quoted text
    const quoteText = annotation.quote || annotation.selected_text || '';
    elements.selectedTextQuote.textContent = `\"${quoteText}\"`;
    
    // Render the thread
    renderAnnotationThread(thread, annotation);
    
    // Setup reply form
    elements.commentInput.value = '';
    elements.annotationForm.dataset.startOffset = '';
    elements.annotationForm.dataset.endOffset = '';
    elements.annotationForm.dataset.selectedText = quoteText;
    elements.annotationForm.dataset.parentId = annotation.id;
    
    // Highlight the active annotation
    document.querySelectorAll('.highlight.active').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-annotation-id="${annotation.id}"]`)?.classList.add('active');
    
    openSidebar();
}

/**
 * Build thread from annotation ID (find all nested replies)
 */
function buildAnnotationThread(annotationId) {
    // Find the root annotation object from the flat list.
    const root = currentAnnotations.find(a => a.id === annotationId);
    if (!root) return null;

    // A recursive function to find and attach replies at any depth.
    const buildReplies = (parentId) => {
        // Find all direct children for the given parent.
        const directReplies = currentAnnotations.filter(a => a.parent_id === parentId);
        
        // For each child, recurse to find their own children.
        directReplies.forEach(reply => {
            reply.replies = buildReplies(reply.id);
        });
        
        // Sort the replies by date for consistent order.
        directReplies.sort((a, b) => {
            const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
            const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
            return dateA - dateB;
        });

        return directReplies;
    }

    // Start the process from the root annotation.
    root.replies = buildReplies(annotationId);
    
    return root;
}

/**
 * Render annotation thread in sidebar
 */
function renderAnnotationThread(thread, rootAnnotation) {
    if (!elements.annotationThread) return;
    
    let html = '';
    
    // Root comment
    html += `
        <div class="comment root-comment" data-id="${rootAnnotation.id}">
            <div class="comment-header">
                <span class="comment-author">${rootAnnotation.pseudo || 'Anonyme'}</span>
                <span class="comment-date">${formatDate(rootAnnotation.created_at)}</span>
                ${(rootAnnotation.pseudo === currentPseudo || adminToken) ? 
                    `<button class="btn-icon-small delete-btn" data-action="delete" data-id="${rootAnnotation.id}" title="Supprimer">🗑️</button>` : ''}
            </div>
            <div class="comment-body">${escapeHtml(rootAnnotation.comment)}</div>
            <button class="comment-reply-btn" data-action="reply" data-id="${rootAnnotation.id}">↩ Répondre</button>
        </div>
    `;
    
    // Replies (if any)
    if (rootAnnotation.replies && rootAnnotation.replies.length > 0) {
        html += renderReplies(rootAnnotation.replies);
    }
    
    elements.annotationThread.innerHTML = html;
}

/**
 * Recursively render replies
 */
function renderReplies(replies, depth = 1) {
    if (!replies || replies.length === 0) return '';
    
    let html = '';
    for (const reply of replies) {
        html += `
            <div class="comment reply" style="margin-left: ${depth * 20}px" data-id="${reply.id}">
                <div class="comment-header">
                    <span class="comment-author">${reply.pseudo || 'Anonyme'}</span>
                    <span class="comment-date">${formatDate(reply.created_at)}</span>
                    ${(reply.pseudo === currentPseudo || adminToken) ? 
                        `<button class="btn-icon-small delete-btn" data-action="delete" data-id="${reply.id}" title="Supprimer">🗑️</button>` : ''}
                </div>
                <div class="comment-body">${escapeHtml(reply.comment)}</div>
                <button class="comment-reply-btn" data-action="reply" data-id="${reply.id}">↩ Répondre</button>
            </div>
        `;
        if (reply.replies && reply.replies.length > 0) {
            html += renderReplies(reply.replies, depth + 1);
        }
    }
    return html;
}

/**
 * Setup reply to a specific annotation
 */
/**
 * Handle annotation actions (Delegation)
 */
function handleAnnotationAction(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    
    if (action === 'reply') {
        replyToAnnotation(id);
    } else if (action === 'delete') {
        deleteAnnotation(id);
    }
}

/**
 * Setup reply to a specific annotation
 */
async function replyToAnnotation(annotationId) {
    // Set parent ID for reply
    elements.annotationForm.dataset.parentId = annotationId;
    elements.annotationForm.dataset.startOffset = '';
    elements.annotationForm.dataset.endOffset = '';
    elements.annotationForm.dataset.selectedText = '';
    
    // Focus the input and scroll to it
    elements.commentInput.focus();
    elements.commentInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    elements.commentInput.placeholder = 'Votre réponse...';
    
    // Highlight the comment being replied to
    document.querySelectorAll('.comment.replying').forEach(el => el.classList.remove('replying'));
    document.querySelector(`.comment[data-id="${annotationId}"]`)?.classList.add('replying');
}

/**
 * Delete an annotation
 */
async function deleteAnnotation(annotationId) {
    if (!confirm('Voulez-vous vraiment supprimer ce commentaire ?')) {
        return;
    }
    
    try {
        await annotations.delete(annotationId, currentPseudo, adminToken);
        
        // Refresh
        await openChapter(currentChapterId);
        closeSidebar();
        
    } catch (error) {
        console.error('Error deleting annotation:', error);
        alert('❌ Erreur: ' + error.message);
    }
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    
    let date;
    // Handle Firestore Timestamp (has toDate method)
    if (typeof dateStr === 'object' && typeof dateStr.toDate === 'function') {
        date = dateStr.toDate();
    } else {
        date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Handle new annotation from selection
 */
function handleNewAnnotation(selection) {
    if (!selection) return;
    
    elements.selectedTextQuote.textContent = `"${selection.text}"`;
    elements.annotationThread.innerHTML = ''; // New annotation, no existing thread
    elements.commentInput.value = '';
    
    // Store selection data for submission
    elements.annotationForm.dataset.startOffset = selection.start;
    elements.annotationForm.dataset.endOffset = selection.end;
    elements.annotationForm.dataset.selectedText = selection.text;
    elements.annotationForm.dataset.parentId = '';
    
    openSidebar();
}

/**
 * Handle annotation form submission
 */
async function handleAnnotationSubmit(e) {
    e.preventDefault();
    
    const comment = elements.commentInput.value.trim();
    if (!comment) return;
    
    const form = elements.annotationForm;
    const data = {
        pseudo: currentPseudo || 'Anonyme',
        comment,
        start_offset: parseInt(form.dataset.startOffset) || null,
        end_offset: parseInt(form.dataset.endOffset) || null,
        quote: form.dataset.selectedText || null,
    };
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Visual feedback
    submitBtn.textContent = 'Envoi...';
    submitBtn.disabled = true;

    try {
        let result;
        if (form.dataset.parentId) {
            // Reply to existing annotation
            result = await annotations.reply(form.dataset.parentId, {
                pseudo: currentPseudo || 'Anonyme',
                comment,
            });
        } else {
            // New annotation
            result = await annotations.create(currentChapterId, data);
        }

        // Success feedback
        submitBtn.textContent = 'Envoyé !';
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1000);

        // Store context ID to restore view
        const createdId = result.id;
        const parentId = form.dataset.parentId;

        // Reload chapter and annotations (to get fresh data)
        await openChapter(currentChapterId);
        
        // Restore context (keep sidebar open and show thread)
        if (parentId) {
            // We posted a reply, so we want to see the parent thread again
            const parentAnnotation = currentAnnotations.find(a => a.id === parentId);
            if (parentAnnotation) {
                handleHighlightClick(parentAnnotation);
            }
        } else {
            // We posted a new root annotation
            const newAnnotation = currentAnnotations.find(a => a.id === createdId);
            if (newAnnotation) {
                handleHighlightClick(newAnnotation);
            }
        }
        
    } catch (error) {
        console.error('Error submitting annotation:', error);
        submitBtn.textContent = 'Erreur !';
        alert(`Erreur : ${error.message}`);
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    }
}

/**
 * Open annotation sidebar
 */
function openSidebar() {
    elements.annotationSidebar?.classList.remove('hidden');
    elements.chapterContent?.classList.add('has-active-highlight');
}

/**
 * Close annotation sidebar
 */
function closeSidebar() {
    elements.annotationSidebar?.classList.add('hidden');
    elements.chapterContent?.classList.remove('has-active-highlight');
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

// ==========================================
// ADMIN CONSOLE FUNCTIONS
// ==========================================

/**
 * Setup admin event listeners
 */
function setupAdminListeners() {
    // Admin logout
    document.getElementById('admin-logout')?.addEventListener('click', () => {
        adminToken = '';
        localStorage.removeItem('scribeloop_admin_token');
        window.location.hash = '';
        showView('landing');
    });
    
    // Metadata form
    document.getElementById('metadata-form')?.addEventListener('submit', handleMetadataSubmit);
    
    // Chapter form
    document.getElementById('chapter-form')?.addEventListener('submit', handleChapterSubmit);
    
    // Cancel edit button
    document.getElementById('cancel-edit')?.addEventListener('click', cancelEdit);
}

/**
 * Prompt for admin login
 */
function promptAdminLogin() {
    // Check if admin modal exists, if not use prompt as fallback
    let modal = document.getElementById('admin-login-modal');
    
    if (!modal) {
        // Create modal dynamically
        modal = document.createElement('div');
        modal.id = 'admin-login-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>🔐 Connexion Admin</h2>
                <form id="admin-login-form">
                    <input type="password" id="admin-token-input" placeholder="Token admin" required>
                    <div class="modal-actions">
                        <button type="button" id="admin-cancel-btn" class="btn-secondary">Annuler</button>
                        <button type="submit" class="btn-primary">Connexion</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Setup modal event listeners
        document.getElementById('admin-login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const token = document.getElementById('admin-token-input').value;
            if (token) {
                adminToken = token;
                localStorage.setItem('scribeloop_admin_token', token);
                // Assuming successful token validation implies admin status
                currentPseudo = 'Admin'; // Ensure Admin has a pseudo for comments
                modal.classList.add('hidden');
                showView('admin');
                loadAdmin();
            }
        });
        
        document.getElementById('admin-cancel-btn').addEventListener('click', () => {
            modal.classList.add('hidden');
            window.location.hash = '';
            handleHashChange();
        });
    }
    
    // Show modal
    modal.classList.remove('hidden');
    document.getElementById('admin-token-input').value = '';
    document.getElementById('admin-token-input').focus();
}

/**
 * Load admin console data
 */
async function loadAdmin() {
    try {
        // Load metadata
        const meta = await metadata.get();
        document.getElementById('meta-title').value = meta.book_title || '';
        document.getElementById('meta-chapters').value = meta.total_chapters || 10;
        
        // Load chapters
        const chapterList = await chapters.list();
        renderAdminChapterList(chapterList);
        
    } catch (error) {
        console.error('Error loading admin:', error);
        alert('Erreur de chargement. Vérifiez votre token.');
    }
}

/**
 * Render chapter list in admin
 */
function renderAdminChapterList(chapterList) {
    const container = document.getElementById('admin-chapter-list');
    if (!container) return;
    
    if (chapterList.length === 0) {
        container.innerHTML = '<li class="empty-state">Aucun chapitre créé</li>';
        return;
    }
    
    container.innerHTML = chapterList.map(chapter => `
        <li class="admin-chapter-item">
            <div class="chapter-info">
                <span class="chapter-title">${chapter.title}</span>
                <span class="chapter-status">${getStatusBadge(chapter.status)}</span>
            </div>
            <div class="chapter-actions">
                <button class="btn-icon" onclick="window.editChapter('${chapter.id}')" title="Modifier">✏️</button>
                <button class="btn-icon btn-danger" onclick="window.deleteChapter('${chapter.id}')" title="Supprimer">🗑️</button>
            </div>
        </li>
    `).join('');
}

/**
 * Handle metadata form submission
 */
async function handleMetadataSubmit(e) {
    e.preventDefault();
    
    const book_title = document.getElementById('meta-title').value.trim();
    const total_chapters = parseInt(document.getElementById('meta-chapters').value);
    
    try {
        await metadata.update({ book_title, total_chapters }, adminToken);
        alert('✅ Paramètres sauvegardés!');
    } catch (error) {
        console.error('Error updating metadata:', error);
        if (error.message.includes('Unauthorized') || error.message.includes('Permission denied')) {
            alert('🔒 Session expirée ou token invalide. Veuillez vous reconnecter.');
            localStorage.removeItem('scribeloop_admin_token');
            adminToken = '';
            promptAdminLogin();
        } else {
            alert('❌ Erreur: ' + error.message);
        }
    }
}

/**
 * Handle chapter form submission
 */
async function handleChapterSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('admin-chapter-title').value.trim();
    const content_md = document.getElementById('admin-chapter-content').value;
    const status = document.getElementById('admin-chapter-status').value;
    
    try {
        if (editingChapterId) {
            // Update existing
            await chapters.update(editingChapterId, { title, content_md, status }, adminToken);
            alert('✅ Chapitre mis à jour!');
            cancelEdit();
        } else {
            // Create new
            await chapters.create({ title, content_md, status }, adminToken);
            alert('✅ Chapitre créé!');
            // Reset form
            document.getElementById('chapter-form').reset();
        }
        
        // Reload chapter list
        loadAdmin();
        
    } catch (error) {
        console.error('Error saving chapter:', error);
        if (error.message.includes('Unauthorized') || error.message.includes('Permission denied')) {
            alert('🔒 Session expirée ou token invalide. Veuillez vous reconnecter.');
            localStorage.removeItem('scribeloop_admin_token');
            adminToken = '';
            promptAdminLogin();
        } else {
            alert('❌ Erreur: ' + error.message);
        }
    }
}

/**
 * Edit a chapter
 */
window.editChapter = async function(id) {
    try {
        const chapter = await chapters.get(id);
        
        document.getElementById('admin-chapter-title').value = chapter.title;
        document.getElementById('admin-chapter-content').value = chapter.content_md;
        document.getElementById('admin-chapter-status').value = chapter.status;
        
        editingChapterId = id;
        
        // Show cancel button and change submit text
        document.getElementById('cancel-edit').classList.remove('hidden');
        document.querySelector('#chapter-form button[type="submit"]').textContent = 'Mettre à jour';
        
        // Scroll to form
        document.getElementById('chapter-form').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error loading chapter:', error);
        alert('❌ Erreur: ' + error.message);
    }
};

/**
 * Cancel editing
 */
function cancelEdit() {
    editingChapterId = null;
    document.getElementById('chapter-form').reset();
    document.getElementById('cancel-edit').classList.add('hidden');
    document.querySelector('#chapter-form button[type="submit"]').textContent = 'Créer le chapitre';
}

/**
 * Delete a chapter
 */
window.deleteChapter = async function(id) {
    if (!confirm('Supprimer ce chapitre ? Toutes les annotations associées seront également supprimées. Cette action est irréversible.')) {
        return;
    }
    
    try {
        await chapters.delete(id, adminToken);
        alert('✅ Chapitre supprimé.');
        loadAdmin(); // Reload the admin list
    } catch (error) {
        console.error('Error deleting chapter:', error);
        if (error.message.includes('Unauthorized')) {
            alert('🔒 Session expirée ou token invalide. Veuillez vous reconnecter.');
            promptAdminLogin();
        } else {
            alert('❌ Erreur lors de la suppression: ' + error.message);
        }
    }
};
