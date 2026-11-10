import { router } from '@inertiajs/react';
import { Play, RotateCw } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

type ServiceKey = 'queue' | 'reverb';
type ActionKey = 'start' | 'restart';

type Props = {
    queueUp: boolean;
    reverbUp: boolean;
    phpCli: string | null;
};

const SERVICES: {
    key: ServiceKey;
    title: string;
    note: string;
    restartWarning: string;
}[] = [
    {
        key: 'queue',
        title: 'Pekerja Latar Belakang',
        note: 'Memproses notifikasi dan tugas latar belakang.',
        restartWarning:
            'Pekerja lama menyelesaikan tugas yang sedang berjalan lalu berhenti, kemudian yang baru dijalankan (sekitar 10 detik). Notifikasi tertunda sebentar.',
    },
    {
        key: 'reverb',
        title: 'Server WebSocket',
        note: 'Mengirim pembaruan real-time ke layar display.',
        restartWarning:
            'Layar display terputus sebentar (sekitar 10-40 detik) lalu tersambung kembali otomatis. Jika server lama tidak mau berhenti, restart dibatalkan.',
    },
];

export function ServiceControlsCard({ queueUp, reverbUp, phpCli }: Props) {
    const [pending, setPending] = useState<{
        service: (typeof SERVICES)[number];
        action: ActionKey;
    } | null>(null);
    const [processing, setProcessing] = useState(false);

    const isUp = (key: ServiceKey) => (key === 'queue' ? queueUp : reverbUp);

    const run = () => {
        if (!pending) {
            return;
        }

        router.post(
            `/admin/services/${pending.service.key}/${pending.action}`,
            {},
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onSuccess: () => {
                    // Beri waktu layanan naik, lalu segarkan status.
                    setTimeout(
                        () =>
                            router.reload({
                                only: ['queue', 'reverb', 'health'],
                            }),
                        pending.action === 'start' ? 5000 : 20000,
                    );
                },
                onFinish: () => {
                    setProcessing(false);
                    setPending(null);
                },
            },
        );
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Kendali Layanan</CardTitle>
                    <CardDescription>
                        Jalankan layanan yang berhenti, atau restart yang sedang
                        berjalan. Dicatat di Log Aktivitas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {SERVICES.map((service) => {
                        const up = isUp(service.key);

                        return (
                            <div
                                key={service.key}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        {service.title}
                                        <Badge
                                            className={
                                                up
                                                    ? 'border-0 bg-green-100 text-green-700'
                                                    : 'border-0 bg-red-100 text-red-700'
                                            }
                                        >
                                            {up ? 'Berjalan' : 'Berhenti'}
                                        </Badge>
                                    </div>
                                    <div className="text-muted-foreground text-sm">
                                        {service.note}
                                    </div>
                                </div>
                                {up ? (
                                    <Button
                                        variant="outline"
                                        disabled={!phpCli}
                                        onClick={() =>
                                            setPending({
                                                service,
                                                action: 'restart',
                                            })
                                        }
                                    >
                                        <RotateCw className="size-4" />
                                        Restart
                                    </Button>
                                ) : (
                                    <Button
                                        disabled={!phpCli}
                                        onClick={() =>
                                            setPending({
                                                service,
                                                action: 'start',
                                            })
                                        }
                                    >
                                        <Play className="size-4" />
                                        Jalankan
                                    </Button>
                                )}
                            </div>
                        );
                    })}

                    <p className="text-muted-foreground text-xs">
                        {phpCli ? (
                            <>
                                PHP terdeteksi:{' '}
                                <span className="font-mono">{phpCli}</span>
                            </>
                        ) : (
                            <span className="text-red-700">
                                PHP tidak ditemukan, tombol dinonaktifkan. Isi{' '}
                                <span className="font-mono">PHP_CLI_PATH</span>{' '}
                                di berkas .env dengan lokasi php.exe.
                            </span>
                        )}
                    </p>
                </CardContent>
            </Card>

            <Dialog
                open={pending !== null}
                onOpenChange={(open) => !open && setPending(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {pending?.action === 'start'
                                ? 'Jalankan'
                                : 'Restart'}{' '}
                            {pending?.service.title}
                        </DialogTitle>
                        <DialogDescription>
                            {pending?.action === 'start'
                                ? 'Layanan akan dijalankan di server ini.'
                                : pending?.service.restartWarning}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setPending(null)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button onClick={run} disabled={processing}>
                            {processing && <Spinner />}
                            Ya, lanjutkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
