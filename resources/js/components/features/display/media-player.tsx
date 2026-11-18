'use client';

import { ImageIcon, VolumeX } from 'lucide-react';
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
    page_urls?: string[];
};

type Props = {
    items?: Item[];
    duration?: number;
} & ComponentProps<'div'>;

const AUDIO_UNLOCK_KEY = 'display-media-audio-unlocked';

function EmptyItem() {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <ImageIcon />
                </EmptyMedia>
                <EmptyTitle>Belum ada media</EmptyTitle>
                <EmptyDescription>
                    Belum ada media aktif untuk ditampilkan. Unggah media pada
                    menu Infografis.
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
    const [showAudioUnlock, setShowAudioUnlock] = useState(false);
    const [audioUnlocked, setAudioUnlocked] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.localStorage.getItem(AUDIO_UNLOCK_KEY) === '1';
    });
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
            // Item tunggal video: putar ulang dari awal agar tidak beku di akhir
            if (item?.type.startsWith('video') && videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(() => {});
            }

            return;
        }

        setIsFade(false); // Mulai efek memudar keluar

        const timer = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
            setIsFade(true); // Memudar masuk dengan konten baru
        }, 350); // Diberi kelonggaran sedikit di atas durasi CSS transition (300ms)

        return () => clearTimeout(timer);
    }, [items.length, item]);

    // Memaksa video berputar otomatis dari awal dengan aman
    useEffect(() => {
        if (!item || !item.type.startsWith('video') || !videoRef.current) {
            return;
        }

        const playVideo = async () => {
            const video = videoRef.current;

            if (!video) {
                return;
            }

            try {
                video.muted = false;
                video.load();
                // Berikan jeda mikro agar elemen DOM video ter-render sempurna sebelum diputar
                await new Promise((resolve) => setTimeout(resolve, 50));
                await video.play();
                setShowAudioUnlock(false);
            } catch (error) {
                console.warn(
                    'Autoplay bersuara terblokir browser, putar senyap:',
                    error,
                );

                video.muted = true;
                video.play().catch(() => {});
                setShowAudioUnlock(true);
            }
        };

        playVideo();
    }, [currentIndex, item]);

    // Aktifkan audio sekali: ikuti user gesture (klik/tap/tombol) untuk melewati kebijakan autoplay browser
    const unlockAudio = useCallback(() => {
        setAudioUnlocked(true);
        window.localStorage.setItem(AUDIO_UNLOCK_KEY, '1');

        const video = videoRef.current;

        if (video && video.muted) {
            video.muted = false;
            video.play().catch(() => {
                video.muted = true;
            });
        }

        setShowAudioUnlock(false);
    }, []);

    useEffect(() => {
        if (audioUnlocked) {
            return;
        }

        const unlock = () => unlockAudio();

        window.addEventListener('pointerdown', unlock, true);
        window.addEventListener('touchstart', unlock, true);
        window.addEventListener('keydown', unlock, true);

        return () => {
            window.removeEventListener('pointerdown', unlock, true);
            window.removeEventListener('touchstart', unlock, true);
            window.removeEventListener('keydown', unlock, true);
        };
    }, [audioUnlocked, unlockAudio]);

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
                'relative flex size-full items-center justify-center overflow-hidden',
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
                        autoPlay
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
                        pages={item.page_urls}
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

            {/* Indikator audio belum aktif — klik untuk mengaktifkan audio video */}
            {showAudioUnlock && item.type.startsWith('video') && (
                <button
                    type="button"
                    onClick={unlockAudio}
                    className="absolute bottom-4 right-4 z-10 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur transition hover:bg-black/70"
                    aria-label="Aktifkan audio"
                    title="Klik untuk mengaktifkan audio"
                >
                    <VolumeX className="size-5" />
                </button>
            )}
        </div>
    );
}
