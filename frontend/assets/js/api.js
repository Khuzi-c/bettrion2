const api = {
    baseUrl: '/api',

    fetch: async (endpoint, options = {}) => {
        const token = localStorage.getItem('user_token') || localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // --- Auto-Append Language ---
        let url = `${api.baseUrl}${endpoint}`;
        if (options.method === 'GET' || !options.method) {
            // Priority 1: URL Path (e.g. /es/casinos)
            const pathSegments = window.location.pathname.split('/');
            const firstSegment = pathSegments[1]; // /es/ -> 'es'
            const validLangs = ['en', 'ar', 'nl', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'tr'];

            let lang = 'en';
            if (validLangs.includes(firstSegment)) {
                lang = firstSegment;
            } else {
                // Priority 2: Browser/Stored Lang
                lang = (navigator.language || 'en').split('-')[0];
            }

            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}lang=${lang}`;
        }
        // ----------------------------

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'API Error');
            }
            return data;
        } catch (error) {
            console.error('API Fetch Error:', error);
            // Return error object so frontend can handle it instead of crashing unhandled promise
            return { success: false, error: error.message };
        }
    },

    get: (endpoint) => api.fetch(endpoint, { method: 'GET' }),
    post: (endpoint, body) => api.fetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body) => api.fetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint) => api.fetch(endpoint, { method: 'DELETE' }),

    upload: async (endpoint, formData) => {
        const token = localStorage.getItem('user_token') || localStorage.getItem('token');
        try {
            const response = await fetch(`${api.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            return data;
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
};

window.api = api;
window.API = api; // Alias

