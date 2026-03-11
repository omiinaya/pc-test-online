import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCSRFToken, clearCSRFToken, fetchWithCSRF } from '../api';

// Mock fetch
const mockFetch = vi.fn();

describe('CSRF Token Utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearCSRFToken();
        global.fetch = mockFetch;
    });

    describe('getCSRFToken', () => {
        it('should fetch token from /api/csrf-token and cache it', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ csrfToken: 'token123' }),
            });

            const token = await getCSRFToken();
            expect(token).toBe('token123');
            expect(mockFetch).toHaveBeenCalledWith('/api/csrf-token', {
                method: 'GET',
                credentials: 'same-origin',
            });
        });

        it('should cache token and not fetch twice', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ csrfToken: 'cached' }),
            });

            await getCSRFToken();
            await getCSRFToken();

            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should throw if response not ok', async () => {
            mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
            await expect(getCSRFToken()).rejects.toThrow('Failed to fetch CSRF token: 500');
        });

        it('should throw if csrfToken missing', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({}),
            });
            await expect(getCSRFToken()).rejects.toThrow('CSRF token missing in response');
        });
    });

    describe('clearCSRFToken', () => {
        it('should clear cached token and allow refetch', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ csrfToken: 'first' }),
            });
            await getCSRFToken();
            expect(mockFetch).toHaveBeenCalledTimes(1);

            clearCSRFToken();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ csrfToken: 'second' }),
            });

            const token = await getCSRFToken();
            expect(token).toBe('second');
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('fetchWithCSRF', () => {
        beforeEach(async () => {
            // Cache a token; this will call fetch once
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ csrfToken: 'mytoken' }),
            });
            await getCSRFToken();
            // Clear the call history; but note the mock implementation for the token fetch is consumed.
            // We will set up a new implementation for the actual request in each test.
            mockFetch.mockClear();
        });

        function getCSRFHeaderFromCall(fetchCallIndex: number): string | undefined {
            // The third argument (init) may have a Headers object in `headers`
            const init = mockFetch.mock.calls[fetchCallIndex][1];
            if (!init) return undefined;
            const headers = init.headers;
            if (headers instanceof Headers) {
                return headers.get('CSRF-Token');
            }
            // If it's a plain object
            return (headers as Record<string, string>)['CSRF-Token'];
        }

        it('should include CSRF header in POST request', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });

            await fetchWithCSRF('/api/test', { method: 'POST' });

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const csrfHeader = getCSRFHeaderFromCall(0);
            expect(csrfHeader).toBe('mytoken');
        });

        it('should include custom headers alongside CSRF', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });

            await fetchWithCSRF('/api/test', {
                method: 'PUT',
                headers: { 'X-Custom': 'value' },
            });

            const init = mockFetch.mock.calls[0][1];
            const headers = init.headers;
            if (headers instanceof Headers) {
                expect(headers.get('X-Custom')).toBe('value');
                expect(headers.get('CSRF-Token')).toBe('mytoken');
            } else {
                // Plain object fallback
                expect((headers as Record<string, string>)['X-Custom']).toBe('value');
                expect((headers as Record<string, string>)['CSRF-Token']).toBe('mytoken');
            }
        });

        it('should not include CSRF header for GET requests', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });

            await fetchWithCSRF('/api/test');

            const init = mockFetch.mock.calls[0][1];
            const headers = init.headers;
            if (headers instanceof Headers) {
                expect(headers.has('CSRF-Token')).toBe(false);
            } else {
                expect((headers as Record<string, string>)['CSRF-Token']).toBeUndefined();
            }
        });

        it('should pass through fetch errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(fetchWithCSRF('/api/test')).rejects.toThrow('Network error');
        });
    });
});
