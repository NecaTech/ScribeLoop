/**
 * ScribeLoop - Firebase Configuration
 * Firestore database for chapters, annotations, and metadata
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, setDoc, query, where, orderBy, serverTimestamp, deleteDoc, writeBatch, limit } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAHcNVAxaZERRwxyk1mAXDFg70bfpu234U",
    authDomain: "scribeloop.firebaseapp.com",
    projectId: "scribeloop",
    storageBucket: "scribeloop.firebasestorage.app",
    messagingSenderId: "715399412582",
    appId: "1:715399412582:web:572a5f6bf02586a0fea6a7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Admin secret (stored in localStorage, verified client-side for UI, but not truly secure)
const ADMIN_SECRET = 'marchistrib';

/**
 * Verify admin token
 */
export function verifyAdmin(token) {
    return token === ADMIN_SECRET;
}

// ==================== CHAPTERS ====================

export const chapters = {
    /**
     * List all chapters
     */
    async list() {
        const chaptersRef = collection(db, 'chapters');
        const q = query(chaptersRef, orderBy('sort_order', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    /**
     * Get single chapter by ID
     */
    async get(id) {
        const docRef = doc(db, 'chapters', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            throw new Error('Chapter not found');
        }
        return { id: docSnap.id, ...docSnap.data() };
    },

    /**
     * Create new chapter (admin only)
     */
    async create(data, adminToken) {
        if (!verifyAdmin(adminToken)) {
            throw new Error('Unauthorized');
        }
        
        const chaptersRef = collection(db, 'chapters');
        
        // Get max sort_order
        const q = query(chaptersRef, orderBy('sort_order', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        
        let newSortOrder = 0;
        if (!querySnapshot.empty) {
            const lastChapter = querySnapshot.docs[0].data();
            newSortOrder = (lastChapter.sort_order || 0) + 1;
        }

        const docRef = await addDoc(chaptersRef, {
            title: data.title,
            content_md: data.content_md,
            status: data.status || 'planned',
            sort_order: newSortOrder,
            created_at: serverTimestamp()
        });
        return { id: docRef.id, message: 'Chapter created' };
    },

    /**
     * Update chapter (admin only)
     */
    async update(id, data, adminToken) {
        if (!verifyAdmin(adminToken)) {
            throw new Error('Unauthorized');
        }
        
        const docRef = doc(db, 'chapters', id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error('Chapter not found');
        }
        
        const chapter = docSnap.data();
        
        // Immutability rule: allow passing content_md if it's identical
        if (chapter.status === 'awaiting_feedback' && data.content_md && data.content_md !== chapter.content_md) {
            throw new Error('Cannot modify content of a chapter awaiting feedback');
        }
        
        const updateData = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.content_md !== undefined) updateData.content_md = data.content_md;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
        
        await updateDoc(docRef, updateData);
        return { message: 'Chapter updated' };
    },

    /**
     * Delete a chapter and all its annotations (admin only)
     */
    async delete(id, adminToken) {
        if (!verifyAdmin(adminToken)) {
            throw new Error('Unauthorized');
        }

        // 1. Get a new write batch
        const batch = writeBatch(db);

        // 2. Delete all annotations for this chapter
        const annotationsRef = collection(db, 'annotations');
        const q = query(annotationsRef, where('chapter_id', '==', id));
        const annotationsSnapshot = await getDocs(q);
        
        annotationsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // 3. Delete the chapter itself
        const chapterRef = doc(db, 'chapters', id);
        batch.delete(chapterRef);

        // 4. Commit the batch
        await batch.commit();
        
        return { message: `Chapter and ${annotationsSnapshot.size} associated annotations deleted.` };
    }
};

// ==================== ANNOTATIONS ====================

export const annotations = {
    /**
     * List annotations for a chapter
     */
    async list(chapterId) {
        const annotationsRef = collection(db, 'annotations');
        const q = query(
            annotationsRef,
            where('chapter_id', '==', chapterId),
            orderBy('created_at', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    /**
     * Create new annotation
     */
    async create(chapterId, data) {
        // Check if chapter is validated
        const chapterRef = doc(db, 'chapters', chapterId);
        const chapterSnap = await getDoc(chapterRef);
        
        if (chapterSnap.exists() && chapterSnap.data().status === 'validated') {
            throw new Error('Cannot add annotations to a validated chapter');
        }
        
        const annotationsRef = collection(db, 'annotations');
        const docRef = await addDoc(annotationsRef, {
            chapter_id: chapterId,
            quote: data.quote,
            comment: data.comment,
            pseudo: data.pseudo,
            start_offset: data.start_offset,
            end_offset: data.end_offset,
            parent_id: data.parent_id || null,
            created_at: serverTimestamp()
        });
        return { id: docRef.id, message: 'Annotation created' };
    },

    /**
     * Reply to an annotation
     */
    async reply(annotationId, data) {
        // Get parent annotation to find chapter_id
        const parentRef = doc(db, 'annotations', annotationId);
        const parentSnap = await getDoc(parentRef);
        
        if (!parentSnap.exists()) {
            throw new Error('Parent annotation not found');
        }
        
        const parent = parentSnap.data();
        
        // Simplified check (optimization)
        /*
        const chapterRef = doc(db, 'chapters', parent.chapter_id);
        const chapterSnap = await getDoc(chapterRef);
        
        if (chapterSnap.exists() && chapterSnap.data().status === 'validated') {
            throw new Error('Cannot reply on a validated chapter');
        }
        */
        
        const annotationsRef = collection(db, 'annotations');
        const docRef = await addDoc(annotationsRef, {
            chapter_id: parent.chapter_id,
            quote: parent.quote || parent.selected_text || null,
            comment: data.comment,
            pseudo: data.pseudo,
            start_offset: (parent.start_offset !== undefined && !isNaN(parent.start_offset)) ? parent.start_offset : null,
            end_offset: (parent.end_offset !== undefined && !isNaN(parent.end_offset)) ? parent.end_offset : null,
            parent_id: annotationId,
            created_at: serverTimestamp()
        });
        return { id: docRef.id, message: 'Reply created' };
    },

    /**
     * Delete an annotation (and its replies)
     */
    async delete(annotationId, userPseudo, adminToken) {
        // Get the annotation first
        const docRef = doc(db, 'annotations', annotationId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error('Annotation not found');
        }
        
        const annotation = docSnap.data();
        const isAdmin = verifyAdmin(adminToken);
        
        // Permission check: Must be author OR admin
        if (annotation.pseudo !== userPseudo && !isAdmin) {
            throw new Error('Unauthorized: You can only delete your own comments');
        }
        
        // Batch delete (cascade logic)
        const batch = writeBatch(db);
        batch.delete(docRef);
        
        // Find and delete all direct replies (simple 1-level cascade for now as per app structure)
        // If nested structure is deeper, this needs recursion, but current app uses flat list with parent_id
        // which builds a tree. We need to find ALL children recursively.
        
        // Helper to find all descendants
        const getAllDescendants = async (parentId) => {
            const annotationsRef = collection(db, 'annotations');
            const q = query(annotationsRef, where('parent_id', '==', parentId));
            const snapshot = await getDocs(q);
            
            const checks = [];
            snapshot.docs.forEach(childDoc => {
                batch.delete(childDoc.ref);
                checks.push(getAllDescendants(childDoc.id));
            });
            
            await Promise.all(checks);
        };
        
        await getAllDescendants(annotationId);
        
        await batch.commit();
        return { message: 'Annotation deleted' };
    }
};

// ==================== USERS ====================

export const users = {
    /**
     * Terme générique pour login ou registration
     * Si l'utilisateur n'existe pas, il est créé au premier login.
     */
    async login(pseudo, password) {
        if (!pseudo || !password) throw new Error('Pseudo et mot de passe requis');
        
        const id = pseudo.toLowerCase().trim();
        const userRef = doc(db, 'users', id);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.password === password) {
                return { pseudo: userData.pseudo };
            } else {
                throw new Error('Ce pseudo est déjà utilisé avec un autre mot de passe.');
            }
        } else {
            // Création automatique au premier login pour simplifier
            await setDoc(userRef, {
                pseudo: pseudo.trim(),
                password: password,
                created_at: serverTimestamp()
            });
            return { pseudo: pseudo.trim(), isNew: true };
        }
    }
};

// ==================== METADATA ====================

export const metadata = {
    /**
     * Get project metadata
     */
    async get() {
        const docRef = doc(db, 'metadata', 'project');
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            // Return defaults if not set
            return { book_title: 'Mon Manuscrit', total_chapters: 10 };
        }
        return docSnap.data();
    },

    /**
     * Update project metadata (admin only)
     */
    async update(data, adminToken) {
        if (!verifyAdmin(adminToken)) {
            throw new Error('Unauthorized');
        }
        
        const docRef = doc(db, 'metadata', 'project');
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            // Create if doesn't exist - use setDoc instead
            const { setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            await setDoc(docRef, {
                book_title: data.book_title || 'Mon Manuscrit',
                total_chapters: data.total_chapters || 10
            });
        } else {
            await updateDoc(docRef, data);
        }
        return { message: 'Metadata updated' };
    }
};

export default { chapters, annotations, users, metadata, verifyAdmin };
