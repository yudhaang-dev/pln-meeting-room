import { router } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * Muat ulang status ruangan tiap menit agar kartu terpakai/tersedia
 * mengikuti waktu tanpa perlu refresh manual.
 */
export function useRoomStatusRefresh(intervalMs = 60000) {
    useEffect(() => {
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') {
                router.reload({ only: ['roomStatuses'] });
            }
        }, intervalMs);

        return () => clearInterval(timer);
    }, [intervalMs]);
}
