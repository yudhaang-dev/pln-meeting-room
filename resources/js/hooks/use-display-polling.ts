import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef } from 'react';

type UseDisplayPollingOptions = {
    only: string[];
};

type Options = {
    autoStart?: boolean;
};

export function useDisplayPolling(
    intervalMs: number,
    requestOptions: UseDisplayPollingOptions,
    options: Options = { autoStart: true },
) {
    const intervalRef = useRef(intervalMs);
    const onlyRef = useRef(requestOptions.only);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedRef = useRef(options.autoStart ?? true);

    const schedule = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
            router.reload({ only: onlyRef.current });
        }, intervalRef.current);
    }, []);

    useEffect(() => {
        intervalRef.current = intervalMs;

        if (startedRef.current) {
            schedule();
        }
    }, [intervalMs, schedule]);

    useEffect(() => {
        onlyRef.current = requestOptions.only;
    }, [requestOptions.only]);

    const stop = useCallback(() => {
        startedRef.current = false;

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const start = useCallback(() => {
        startedRef.current = true;
        schedule();
    }, [schedule]);

    useEffect(() => {
        if (startedRef.current) {
            start();
        }

        return stop;
    }, [start, stop]);

    return { start, stop };
}
