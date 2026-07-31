import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    // 1. Ambil objek props dari usePage
    const { props } = usePage();

    // useEffect Pertama: Menangani Flash Toast dari Controller (Tetap Sama)
    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data = flash?.toast as FlashToast | undefined;

            if (!data) {
                return;
            }

            toast[data.type](data.message);
        });
    }, []);

    // useEffect Kedua: Menangani Error Validasi Laravel
    useEffect(() => {
        // 2. Akses properti errors dengan aman dari props
        const errors = props.errors as Record<string, string> | undefined;

        if (!errors) {
            return;
        }

        const errorKeys = Object.keys(errors);

        if (errorKeys.length > 0) {
            // Mengambil pesan error pertama yang dikembalikan Laravel
            const firstMessage = errors[errorKeys[0]];

            toast.error('Validasi Gagal!', {
                description: firstMessage,
                duration: 4000,
            });
        }
    }, [props.errors]); // <--- Mengawasi perubahan props.errors
}

// import { router } from '@inertiajs/react';
// import { useEffect } from 'react';
// import { toast } from 'sonner';
// import type { FlashToast } from '@/types/ui';

// export function useFlashToast(): void {
//     useEffect(() => {
//         return router.on('flash', (event) => {
//             const flash = (event as CustomEvent).detail?.flash;
//             const data = flash?.toast as FlashToast | undefined;

//             if (!data) {
//                 return;
//             }

//             toast[data.type](data.message);
//         });
//     }, []);
// }
