import type { PageProps } from '@inertiajs/core';
import { Head, router } from '@inertiajs/react';
import { useConnectionStatus, useEchoPublic } from '@laravel/echo-react';
import { useEffect, useState } from 'react';
import { TableSchedule } from '@/components/features/display/table-schedule';
import { TopBar } from '@/components/shared/general/top-bar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDisplayPolling } from '@/hooks/use-display-polling';
import { AUDIO_UNLOCK_EVENT, playBeep } from '@/lib/notification-audio';
import { flashTitle } from '@/lib/title-flash';
import { cn, formatDayDate } from '@/lib/utils';

type Booking = {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    participants_count: number;
    room: {
        id: number;
        name: string;
        building: {
            name: string;
        };
    };
    chairperson: { id: number; name: string } | null;
    osh_level: {
        id: number;
        name: string;
        color: string;
        min_participants: number;
        max_participants: number;
    };
};

type Props = PageProps & {
    todayBookings: Booking[];
    tomorrowBookings: Booking[];
    orientation: string;
    refreshInterval: number;
};

export default function Osh({
    todayBookings,
    tomorrowBookings,
    orientation,
    refreshInterval,
}: Props) {
    const [docTitle, setDocTitle] = useState<string>('');
    const [audioPromptOpen, setAudioPromptOpen] = useState(true);

    useEffect(() => {
        const handleUnlocked = () => setAudioPromptOpen(false);

        window.addEventListener(AUDIO_UNLOCK_EVENT, handleUnlocked);

        return () =>
            window.removeEventListener(AUDIO_UNLOCK_EVENT, handleUnlocked);
    }, []);

    // 1. Ambil status koneksi WebSocket Reverb ("connected", "disconnected", "connecting", dll)
    const connectionStatus = useConnectionStatus();

    // 2. Gunakan polling Inertia dengan opsi manual (autoStart: false)
    const { start: startPolling, stop: stopPolling } = useDisplayPolling(
        refreshInterval * 1000,
        {
            only: ['todayBookings', 'tomorrowBookings', 'refreshInterval'],
        },
        {
            autoStart: false, // Mencegah polling berjalan saat pertama kali render
        },
    );

    // 3. Listen Event menggunakan useEcho jika WebSocket aktif
    useEchoPublic(`Display.Osh`, 'BookingUpdated', () => {
        playBeep();
        setDocTitle('Ada perubahan pada acara');
        flashTitle('Ada perubahan pada acara');
        router.reload({ only: ['todayBookings', 'tomorrowBookings'] });
    });

    useEchoPublic('Display.Global', '.SettingsUpdated', () =>
        router.reload({ only: ['refreshInterval'] }),
    );

    // 4. Logika Sakelar: Hidupkan Polling HANYA JIKA WebSocket Tidak Terhubung
    useEffect(() => {
        if (connectionStatus === 'connected') {
            stopPolling();
        } else {
            startPolling();
        }

        return () => stopPolling();
    }, [connectionStatus, startPolling, stopPolling]);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return (
        <>
            <Head title={docTitle ?? 'OSH Display'} />
            <div className="bg-linear-to-b flex min-h-svh w-full flex-col from-white/70 to-transparent">
                <TopBar
                    className="w-full gap-6 p-6 md:p-10"
                    logoClass="max-h-12"
                />
                <div
                    className={cn(
                        'grid w-full gap-6 p-6 md:p-10',
                        orientation == 'portrait' ? '' : 'md:grid-cols-2',
                    )}
                >
                    <TableSchedule
                        data={todayBookings}
                        title="Jadwal Hari Ini"
                        date={formatDayDate(today)}
                    />
                    <TableSchedule
                        data={tomorrowBookings}
                        title="Jadwal Besok"
                        date={formatDayDate(tomorrow)}
                    />
                </div>
            </div>

            <AlertDialog open={audioPromptOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Suara belum aktif</AlertDialogTitle>
                        <AlertDialogDescription>
                            Klik "Aktifkan Suara" untuk mengaktifkan notifikasi
                            beep pada tampilan OSH.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => {
                                playBeep();
                                setAudioPromptOpen(false);
                            }}
                        >
                            Aktifkan Suara
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
