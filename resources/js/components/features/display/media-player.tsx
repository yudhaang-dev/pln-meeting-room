'use client';

import { ImageIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

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
    // State untuk memicu kelas animasi opacity
    const [isFade, setIsFade] = useState(true);

    const item = useMemo(() => {
        return items[currentIndex];
    }, [items, currentIndex]);

    const isVideo = item?.type.startsWith('video') ?? false;

    const handleNextItem = useCallback(() => {
        setIsFade(false); // Mulai fade-out

        // Tunggu animasi keluar selesai (300ms) sebelum ganti konten
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
            setIsFade(true); // Mulai fade-in untuk konten baru
        }, 300);
    }, [setIsFade, items]);

    useEffect(() => {
        if (isVideo) {
            return;
        }

        // Atur timer dikurangi waktu animasi agar totalnya pas sesuai durasi props
        const timer = setTimeout(
            () => {
                handleNextItem();
            },
            Math.max(0, intervalDuration - 300),
        );

        return () => clearTimeout(timer);
    }, [currentIndex, items.length, isVideo, intervalDuration, handleNextItem]);

    // Handle jika items kosong
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
                {isVideo ? (
                    <video
                        key={item.id}
                        src={item.file_url}
                        className="size-full object-contain"
                        autoPlay
                        muted
                        playsInline
                        onEnded={handleNextItem}
                    />
                ) : (
                    <img
                        key={item.id}
                        src={item.file_url}
                        alt={item.name ?? ''}
                        className="size-full object-contain"
                    />
                )}
            </div>
        </div>
    );
}
