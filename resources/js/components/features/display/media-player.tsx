'use client';

import { ImageIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import { PdfViewer } from './pdf-viewer';

type Item = {
    id: number;
    path: string;
    type: string;
    name: string | null;
    file_url: string;
};

type Props = {
    items?: Item[];
    duration?: number;
} & ComponentProps<'div'>;

function EmptyItem() {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <ImageIcon />
                </EmptyMedia>
                <EmptyTitle>No Media Items</EmptyTitle>
                <EmptyDescription>
                    You haven&apos;t created any projects yet. Get started by
                    creating your first project.
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}

export function MediaPlayer({ items = [], duration = 5, className }: Props) {
    const intervalDuration = useMemo(() => {
        return duration * 1000;
    }, [duration]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFade, setIsFade] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const item = useMemo(() => {
        if (items.length === 0) {
            return null;
        }

        return items[currentIndex] || items[0];
    }, [items, currentIndex]);

    // PERBAIKAN UTAMA: Menggunakan flag penjaga agar pergantian indeks lebih stabil
    const handleNextItem = useCallback(() => {
        if (items.length <= 1) {
            return;
        }

        setIsFade(false); // Mulai efek memudar keluar

        const timer = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
            setIsFade(true); // Memudar masuk dengan konten baru
        }, 350); // Diberi kelonggaran sedikit di atas durasi CSS transition (300ms)

        return () => clearTimeout(timer);
    }, [items.length]);

    // Memaksa video berputar otomatis dari awal dengan aman
    useEffect(() => {
        if (!item || !item.type.startsWith('video') || !videoRef.current) {
            return;
        }

        const playVideo = async () => {
            try {
                if (videoRef.current) {
                    videoRef.current.load();
                    // Berikan jeda mikro agar elemen DOM video ter-render sempurna sebelum diputar
                    await new Promise((resolve) => setTimeout(resolve, 50));
                    await videoRef.current.play();
                }
            } catch (error) {
                console.warn(
                    'Autoplay terblokir browser, mencoba putar paksa (silent):',
                    error,
                );

                if (videoRef.current) {
                    videoRef.current.muted = true;
                    videoRef.current.play().catch(() => {});
                }
            }
        };

        playVideo();
    }, [currentIndex, item]);

    // Timer otomatis khusus untuk tipe Gambar (Image)
    useEffect(() => {
        if (!item || !item.type.startsWith('image') || items.length <= 1) {
            return;
        }

        const timer = setTimeout(
            () => {
                handleNextItem();
            },
            Math.max(0, intervalDuration - 300),
        );

        return () => clearTimeout(timer);
    }, [currentIndex, item, items.length, intervalDuration, handleNextItem]);

    if (!item) {
        return <EmptyItem />;
    }

    return (
        <div
            className={cn(
                'flex size-full items-center justify-center overflow-hidden',
                className,
            )}
        >
            <div
                className={`flex size-full items-center justify-center transition-opacity duration-300 ease-in-out ${
                    isFade ? 'opacity-100' : 'opacity-0'
                }`}
            >
                {/* 1. Tipe Video */}
                {item.type.startsWith('video') && (
                    <video
                        ref={videoRef}
                        key={`video-${item.id}`} // Ditambahkan prefix unik pada key
                        src={item.file_url}
                        className="size-full object-contain"
                        loop
                        autoPlay
                        muted
                        playsInline
                        preload="auto"
                        onEnded={handleNextItem}
                    />
                )}

                {/* 2. Tipe Dokumen (PDF) */}
                {item.type.startsWith('document') && (
                    <PdfViewer
                        key={`pdf-${item.id}`} // Ditambahkan prefix unik pada key
                        src={item.file_url}
                        duration={duration}
                        onEnded={handleNextItem}
                        className="size-full"
                        loop={items.length < 2}
                    />
                )}

                {/* 3. Tipe Gambar (Image) */}
                {item.type.startsWith('image') && (
                    <img
                        key={`image-${item.id}`} // Ditambahkan prefix unik pada key
                        src={item.file_url}
                        alt={item.name ?? ''}
                        className="size-full object-contain"
                    />
                )}
            </div>
        </div>
    );
}
