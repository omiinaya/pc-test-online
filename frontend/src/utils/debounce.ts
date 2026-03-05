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

    return debounce(func, wait, {
        leading,
        trailing,
        maxWait: wait,
    }) as T & {
        cancel(): void;
        flush(): ReturnType<T> | undefined;
    };
}
