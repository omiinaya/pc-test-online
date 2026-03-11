import { describe, it, expect } from 'vitest';
import { sanitizeLogData, sanitizeLogMessage, log } from '../logger';

describe('Logger Utilities', () => {
    describe('sanitizeLogData', () => {
        it('should redact sensitive keys in objects', () => {
            const data = {
                user: 'bob',
                password: 'secret123',
                token: 'abc',
                nested: {
                    apiKey: 'key123',
                    child: {
                        session: 'sess',
                    },
                },
            };
            const sanitized = sanitizeLogData(data);
            expect(sanitized).toEqual({
                user: 'bob',
                password: '[REDACTED]',
                token: '[REDACTED]',
                nested: {
                    apiKey: '[REDACTED]',
                    child: {
                        session: '[REDACTED]',
                    },
                },
            });
        });

        it('should redact arrays recursively', () => {
            const data = [
                { name: 'a', secret: 'x' },
                { name: 'b', token: 'y' },
            ];
            const sanitized = sanitizeLogData(data);
            expect(sanitized[0].secret).toBe('[REDACTED]');
            expect(sanitized[1].token).toBe('[REDACTED]');
        });

        it('should handle null and primitives', () => {
            expect(sanitizeLogData(null)).toBe(null);
            expect(sanitizeLogData('hello')).toBe('hello');
            expect(sanitizeLogData(123)).toBe(123);
        });
    });

    describe('sanitizeLogMessage', () => {
        it('should remove newline and control characters', () => {
            const dirty = 'Hello\nWorld\r\t%';
            const clean = sanitizeLogMessage(dirty);
            expect(clean).toBe('Hello World %');
        });
    });

    describe('log methods', () => {
        it('should call without throwing', () => {
            // Since underlying logger is pino which doesn't throw, just call to cover lines
            log.debug('Debug message', { foo: 'bar' });
            log.info('Info message');
            log.warn('Warn message');
            log.error('Error message', new Error('oops'));
            log.fatal('Fatal message');
        });
    });
});
