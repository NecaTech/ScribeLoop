/**
 * ScribeLoop - API Client
 * Fetch wrapper for backend communication
 */

const API_BASE = '/api';

/**
 * Make an API request
 * @param {string} endpoint - API endpoint (e.g., '/chapters')
 * @param {object} options - Fetch options
 * @returns {Promise<any>}
 */
async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };
    
    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.json();
}

// Chapters API
export const chapters = {
    list: () => request('/chapters'),
    get: (id) => request(`/chapters/${id}`),
    create: (data, adminToken) => request('/chapters', {
        method: 'POST',
        body: data,
        headers: { 'x-admin-token': adminToken }
    }),
    update: (id, data, adminToken) => request(`/chapters/${id}`, {
        method: 'PUT',
        body: data,
        headers: { 'x-admin-token': adminToken }
    }),
};

// Annotations API
export const annotations = {
    list: (chapterId) => request(`/chapters/${chapterId}/annotations`),
    create: (chapterId, data) => request(`/chapters/${chapterId}/annotations`, {
        method: 'POST',
        body: data,
    }),
    reply: (annotationId, data) => request(`/annotations/${annotationId}/reply`, {
        method: 'POST',
        body: data,
    }),
};

// Metadata API
export const metadata = {
    get: () => request('/metadata'),
    update: (data, adminToken) => request('/metadata', {
        method: 'PUT',
        body: data,
        headers: { 'x-admin-token': adminToken }
    }),
};

export default { chapters, annotations, metadata };

