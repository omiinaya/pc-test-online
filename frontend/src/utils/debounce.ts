/* eslint-disable @typescript-eslint/no-explicit-any */
// Debounce and Throttle utilities for performance optimization
// These use `any` internally to preserve `this` context for any function signature

export interface DebounceOptions {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options: DebounceOptions = {}
): T & { cancel(): void; flush(): ReturnType<T> | undefined } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastThis: any = null;
    let result: any;
    let lastCallTime: number | null = null;
    let lastInvokeTime = 0;

    const { leading = false, trailing = true, maxWait } = options;

    const shouldInvoke = (time: number): boolean => {
        const timeSinceLastCall = lastCallTime ? time - lastCallTime : wait;
        const timeSinceLastInvoke = time - lastInvokeTime;

        return (
            !lastCallTime ||
            timeSinceLastCall >= wait ||
            (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
        );
    };

    const invokeFunc = (time: number): void => {
        const args = lastArgs;
        const thisArg = lastThis;

        lastArgs = null;
        lastThis = null;
        lastInvokeTime = time;
        lastCallTime = null;

        if (args) {
            result = func.apply(thisArg, args);
        }
    };

    const trailingEdge = (time: number): void => {
        timeoutId = null;
        if (trailing && lastArgs) {
            invokeFunc(time);
        }
    };

    const timerExpired = (): void => {
        const currentTime = Date.now();
        if (shouldInvoke(currentTime)) {
            trailingEdge(currentTime);
            return;
        }

        const timeSinceLastCall = currentTime - (lastCallTime || 0);
        const timeLeft = wait - timeSinceLastCall;
        const timeSinceLastInvoke = currentTime - lastInvokeTime;
        const maxWaitingTime = maxWait ? maxWait - timeSinceLastInvoke : undefined;

        const remainingWait = Math.min(
            timeLeft,
            maxWaitingTime !== undefined ? maxWaitingTime : timeLeft
        );

        timeoutId = setTimeout(timerExpired, remainingWait);
    };

    const debounced = function (this: any, ...args: Parameters<T>): void {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);

        lastArgs = args;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
            if (!timeoutId) {
                lastInvokeTime = time;
                timeoutId = setTimeout(timerExpired, wait);
            }

            if (leading) {
                invokeFunc(time);
            }
        } else if (!timeoutId && trailing) {
            timeoutId = setTimeout(timerExpired, wait);
        }
    };

    debounced.cancel = (): void => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        lastArgs = null;
        lastThis = null;
        lastCallTime = null;
        lastInvokeTime = 0;
        timeoutId = null;
    };

    debounced.flush = (): ReturnType<T> | undefined => {
        if (timeoutId !== null) {
            trailingEdge(Date.now());
        }
        return result;
    };

    return debounced as T & {
        cancel(): void;
        flush(): ReturnType<T> | undefined;
    };
}

export function throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options: { leading?: boolean; trailing?: boolean } = {}
): T & { cancel(): void; flush(): ReturnType<T> | undefined } {
    const { leading = true, trailing = true } = options;
    let lastArgs: Parameters<T> | null = null;
    let lastThis: any = null;
    let lastCallTime: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let result: any;

    const invoke = (time: number): void => {
        const args = lastArgs;
        const thisArg = lastThis;
        lastArgs = null;
        lastThis = null;
        lastCallTime = time;
        if (args) {
            result = func.apply(thisArg, args);
        }
    };

    const shouldInvoke = (time: number): boolean => {
        if (lastCallTime === null) return leading;
        const timeSince = time - lastCallTime;
        return timeSince >= wait;
    };

    const throttled = function (this: any, ...args: Parameters<T>): void {
        const time = Date.now();
        const invokeNow = shouldInvoke(time);

        lastArgs = args;
        lastThis = this;

        if (invokeNow) {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            invoke(time);
        } else if (!timeoutId && trailing) {
            const remaining = wait - (time - lastCallTime!);
            timeoutId = setTimeout(() => {
                if (lastArgs) {
                    invoke(Date.now());
                }
                timeoutId = null;
            }, remaining);
        }
    };

    throttled.cancel = (): void => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        lastArgs = null;
        lastThis = null;
        timeoutId = null;
    };

    throttled.flush = (): ReturnType<T> | undefined => {
        if (timeoutId !== null && lastArgs) {
            clearTimeout(timeoutId);
            timeoutId = null;
            const res = func.apply(lastThis, lastArgs);
            lastArgs = null;
            lastThis = null;
            result = res;
            return res;
        }
        return result;
    };

    return throttled as T & { cancel(): void; flush(): ReturnType<T> | undefined };
}
