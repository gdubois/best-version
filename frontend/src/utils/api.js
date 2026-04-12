/**
 * API Configuration
 * Provides a centralized way to handle API URLs across the application.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Get the full API URL for a given endpoint
 * @param {string} endpoint - The API endpoint (e.g., '/api/admin/reviews')
 * @returns {string} Full API URL
 */
export function getApiUrl(endpoint) {
    // If endpoint already starts with http/https, return as-is
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
        return endpoint;
    }

    // If API_BASE_URL is set and endpoint doesn't start with /, prepend /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    return API_BASE_URL ? `${API_BASE_URL}${normalizedEndpoint}` : normalizedEndpoint;
}

/**
 * Get the server protocol (for WebSocket connections, etc.)
 * @returns {string} 'ws' or 'wss'
 */
export function getWsProtocol() {
    return import.meta.env.PROD ? 'wss' : 'ws';
}

/**
 * Get headers for API requests
 * @param {Object} options - Additional headers
 * @returns {Object} Headers object
 */
export function getApiHeaders(options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Add auth token if provided
    if (options.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
    }

    return headers;
}

/**
 * Make an API request with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
export async function apiRequest(endpoint, options = {}) {
    const url = getApiUrl(endpoint);

    try {
        const response = await fetch(url, {
            headers: getApiHeaders(options),
            ...options
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API request failed: ${url}`, error);
        throw error;
    }
}
