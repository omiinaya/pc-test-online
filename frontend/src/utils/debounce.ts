// Debounce and Throttle utilities for performance optimization

export interface DebounceOptions {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
}

export function debounce<Args extends unknown[], R>(
    func: (...args: Args) => R,
    wait: number,
    options: DebounceOptions = {}
): ((...args: Args) => void) & { cancel(): void; flush(): R | undefined } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let pending: (() => R) | null = null;
    let result: R | undefined;
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
        const currentPending = pending;
        pending = null;
        lastInvokeTime = time;
        lastCallTime = null;
        if (currentPending) {
            result = currentPending();
        }
    };

    const trailingEdge = (time: number): void => {
        timeoutId = null;
        if (trailing && pending) {
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

    const debounced = function (this: unknown, ...args: Args): void {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);

        pending = () => func.apply(this, args);
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
        pending = null;
        lastCallTime = null;
        lastInvokeTime = 0;
        timeoutId = null;
    };

    debounced.flush = (): R | undefined => {
        if (timeoutId !== null) {
            trailingEdge(Date.now());
        }
        return result;
    };

    return debounced as ((...args: Args) => void) & {
        cancel(): void;
        flush(): R | undefined;
    };
}

export function throttle<Args extends unknown[], R>(
    func: (...args: Args) => R,
    wait: number,
    options: { leading?: boolean; trailing?: boolean } = {}
): ((...args: Args) => void) & { cancel(): void; flush(): R | undefined } {
    const { leading = true, trailing = true } = options;
    let pending: (() => R) | null = null;
    let lastCallTime: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let result: R | undefined;

    const invoke = (time: number): void => {
        const currentPending = pending;
        pending = null;
        lastCallTime = time;
        if (currentPending) {
            result = currentPending();
        }
    };

    const shouldInvoke = (time: number): boolean => {
        if (lastCallTime === null) return leading;
        const timeSince = time - lastCallTime;
        return timeSince >= wait;
    };

    const throttled = function (this: unknown, ...args: Args): void {
        const time = Date.now();
        const invokeNow = shouldInvoke(time);

        pending = () => func.apply(this, args);

        if (invokeNow) {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            invoke(time);
        } else if (!timeoutId && trailing) {
            const remaining = wait - (time - lastCallTime!);
            timeoutId = setTimeout(() => {
                if (pending) {
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
        pending = null;
        timeoutId = null;
    };

    throttled.flush = (): R | undefined => {
        if (timeoutId !== null && pending) {
            clearTimeout(timeoutId);
            timeoutId = null;
            const res = pending();
            pending = null;
            result = res;
            return res;
        }
        return result;
    };

    return throttled as ((...args: Args) => void) & {
        cancel(): void;
        flush(): R | undefined;
    };
}
