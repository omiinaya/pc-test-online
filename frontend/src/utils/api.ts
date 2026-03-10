/**
 * API client with CSRF token support for state-changing requests.
 * Fetches CSRF token from backend and includes it in POST/PUT/DELETE requests.
 */

let cachedCSRFToken: string | null = null;

/**
 * Fetch CSRF token from the backend and cache it.
 * The token endpoint is protected by the CSRF middleware itself, so this GET
 * request does not require a token.
 */
export async function getCSRFToken(): Promise<string> {
    if (cachedCSRFToken) {
        return cachedCSRFToken;
    }

    try {
        const response = await fetch('/api/csrf-token', {
            method: 'GET',
            credentials: 'same-origin', // include cookies
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch CSRF token: ${response.status}`);
        }
        const data = await response.json();
        cachedCSRFToken = data.csrfToken;
        return cachedCSRFToken!;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        throw error;
    }
}

/**
 * Clears the cached CSRF token (e.g., on logout or token expiry).
 */
export function clearCSRFToken(): void {
    cachedCSRFToken = null;
}

/**
 * Fetch wrapper that automatically includes CSRF token for unsafe HTTP methods.
 * Use this for all state-changing requests (POST, PUT, DELETE, PATCH).
 *
 * @param url - The endpoint URL (relative to origin)
 * @param options - Fetch options (will be modified to include CSRF header)
 * @returns Response promise
 */
export async function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
    const method = (options.method ?? 'GET').toUpperCase();
    const isUnsafe = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

    const headers = new Headers(options.headers);

    // Ensure Content-Type is set for JSON bodies; also add CSRF token if needed
    if (isUnsafe) {
        try {
            const token = await getCSRFToken();
            headers.set('CSRF-Token', token);
        } catch (error) {
            // If we cannot get a CSRF token, fail early
            console.error('Cannot perform state-changing request without CSRF token');
            throw error;
        }
    }

    return fetch(url, {
        ...options,
        headers,
        credentials: 'same-origin',
    });
}
