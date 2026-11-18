'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

type Props = {
    src: string;
    /** Gambar per halaman hasil konversi saat unggah; bila ada, PDF.js tidak dipakai (kompatibel Tizen). */
    pages?: string[];
    duration?: number;
    onEnded?: () => void;
    className?: string;
    loop?: boolean;
};

export function PdfViewer({
    src,
    pages,
    duration = 10,
    onEnded,
    className,
    loop = true,
}: Props) {
    const [isFade, setIsFade] = useState(true);
    const intervalDuration = useMemo(() => {
        return duration * 1000;
    }, [duration]);

    const [docPages, setDocPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [displayPage, setDisplayPage] = useState<number>(1);

    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [pdfRatio, setPdfRatio] = useState<number>(0);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    const hasPages = Array.isArray(pages) && pages.length > 0;
    const pageCount = hasPages ? pages.length : 0;
    const totalPage = hasPages ? pageCount : docPages;

    function onDocumentLoadSuccess(pdf: { numPages: number }): void {
        setDocPages(pdf.numPages);
        setCurrentPage(1);
        setDisplayPage(1);
    }

    function onPageLoadSuccess(page: any): void {
        setPdfRatio(page.originalWidth / page.originalHeight);
    }

    const pageDimensions = useMemo(() => {
        if (!dimensions.width || !dimensions.height || !pdfRatio) {
            return {};
        }

        const containerRatio = dimensions.width / dimensions.height;

        if (pdfRatio > containerRatio) {
            return { width: dimensions.width };
        } else {
            return { height: dimensions.height };
        }
    }, [dimensions, pdfRatio]);

    // PERBAIKAN LOGIKA: Fungsi ini sekarang murni hanya untuk transisi perpindahan halaman biasa
    const handleNextPage = useCallback(() => {
        setIsFade(false); // Mulai animasi memudar keluar

        setTimeout(() => {
            setCurrentPage((prevPage) => {
                // Skenario A: Jika loop aktif dan sudah di akhir, reset ke halaman 1
                if (prevPage >= totalPage && totalPage > 0 && loop) {
                    setDisplayPage(1);

                    return 1;
                }

                // Skenario B: Lanjut ke halaman berikutnya secara normal
                const nextPage = prevPage + 1;
                setDisplayPage(nextPage);

                return nextPage;
            });

            setIsFade(true); // Mulai animasi memudar masuk kembali
        }, 300);
    }, [totalPage, loop]);

    // PERBAIKAN UTAMA: Hubungkan siklus timer dan trigger onEnded menggunakan satu pola efek tunggal yang sinkron
    useEffect(() => {
        if (totalPage <= 0) {
            return;
        }

        // Jika hanya ada 1 halaman total pada dokumen PDF
        if (totalPage === 1) {
            const timer = setTimeout(
                () => {
                    if (onEnded) {
                        onEnded();
                    }
                },
                Math.max(0, intervalDuration),
            );

            return () => clearTimeout(timer);
        }

        // KONDISI UTAMA: Jika loop dinonaktifkan (loop == false) DAN posisi sudah di halaman terakhir
        if (!loop && currentPage === totalPage) {
            const timer = setTimeout(
                () => {
                    if (onEnded) {
                        onEnded(); // Picu fungsi callback ke parent MediaPlayer setelah durasi tayang halaman terakhir habis
                    }
                },
                Math.max(0, intervalDuration),
            );

            return () => clearTimeout(timer);
        }

        // Kondisi Berjalan Normal (Belum mencapai akhir halaman dokumen)
        const timer = setTimeout(
            () => {
                handleNextPage();
            },
            Math.max(0, intervalDuration),
        );

        return () => clearTimeout(timer);
    }, [
        intervalDuration,
        totalPage,
        currentPage,
        loop,
        handleNextPage,
        onEnded,
    ]);

    return (
        <div
            ref={containerRef}
            className={cn(
                'relative flex items-center justify-center overflow-hidden',
                className,
            )}
        >
            {hasPages ? (
                <img
                    src={pages[Math.min(displayPage, pageCount) - 1]}
                    alt=""
                    className={`size-full object-contain transition-opacity duration-300 ease-in-out ${
                        isFade ? 'opacity-100' : 'opacity-0'
                    }`}
                />
            ) : (
                <Document
                    file={src}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<Spinner />}
                    className="flex size-full items-center justify-center"
                >
                    <Page
                        pageNumber={displayPage}
                        onLoadSuccess={onPageLoadSuccess}
                        {...pageDimensions}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className={`transition-opacity duration-300 ease-in-out ${
                            isFade ? 'opacity-100' : 'opacity-0'
                        }`}
                    />
                </Document>
            )}

            {totalPage > 0 && (
                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 transform rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                    {currentPage} / {totalPage}
                </div>
            )}
        </div>
    );
}
