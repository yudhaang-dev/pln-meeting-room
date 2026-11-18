import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const MAX_SIDE = 1920;
const MAX_PAGES = 100;

export type RenderedPage = { blob: Blob; index: number };

/**
 * Render setiap halaman PDF menjadi gambar JPEG (sisi terpanjang maks. 1920 px)
 * di browser pengunggah, agar layar TV (Tizen) tidak perlu PDF.js.
 */
export async function renderPdfPages(
    file: File,
    onPage?: (done: number, total: number) => void,
): Promise<Blob[]> {
    const data = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data }).promise;

    try {
        const total = Math.min(pdf.numPages, MAX_PAGES);
        const blobs: Blob[] = [];

        for (let n = 1; n <= total; n++) {
            const page = await pdf.getPage(n);
            const base = page.getViewport({ scale: 1 });
            const scale = MAX_SIDE / Math.max(base.width, base.height);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            canvas.width = Math.round(viewport.width);
            canvas.height = Math.round(viewport.height);
            const context = canvas.getContext('2d');

            if (!context) {
                throw new Error('Canvas tidak tersedia');
            }

            // Latar putih agar halaman transparan tidak menjadi hitam di JPEG.
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);

            await page.render({ canvasContext: context, viewport, canvas })
                .promise;

            const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, 'image/jpeg', 0.85),
            );

            page.cleanup();
            canvas.width = 0;
            canvas.height = 0;

            if (!blob) {
                throw new Error('Gagal membuat gambar halaman');
            }

            blobs.push(blob);
            onPage?.(n, total);
        }

        return blobs;
    } finally {
        void pdf.destroy();
    }
}
