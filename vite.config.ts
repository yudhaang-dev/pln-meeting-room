import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.tsx'],
            refresh: true,
        }),
        inertia({
            ssr: false,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    // TAMBAHKAN BLOK KONFIGURASI BUILD DI BAWAH INI
    build: {
        rollupOptions: {
            output: {
                // Mengatur strategi pemecahan chunk secara manual
                manualChunks(id) {
                    // Pisahkan semua core vendor dari node_modules menjadi partial bundle terpisah
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('scheduler')) {
                            return 'vendor-react'; // Bundle khusus React core
                        }
                        if (id.includes('@inertiajs')) {
                            return 'vendor-inertia'; // Bundle khusus Inertia
                        }
                        return 'vendor-others'; // Bundle library pihak ketiga lainnya
                    }
                },
                // Opsional: Membuat format nama file chunk lebih rapi di folder build publik
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
            },
        },
        // Mencegah peringatan jika ada satu berkas parsial yang ukurannya agak besar
        chunkSizeWarningLimit: 1000,
    },
});
