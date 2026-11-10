import { router } from '@inertiajs/react';
import { Database, Eraser, LogOut } from 'lucide-react';
import { useState } from 'react';
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

type Action = {
    key: 'clear-cache' | 'logout-all';
    title: string;
    description: string;
    confirm: string;
    destructive: boolean;
    url: string;
};

const ACTIONS: Action[] = [
    {
        key: 'clear-cache',
        title: 'Bersihkan Cache',
        description:
            'Menghapus cache konfigurasi, rute, dan tampilan. Berguna jika halaman terasa aneh atau lambat. Layanan latar belakang tidak terganggu.',
        confirm:
            'Cache konfigurasi, rute, dan tampilan akan dibersihkan. Halaman berikutnya mungkin terasa sedikit lebih lambat sebentar. Lanjutkan?',
        destructive: false,
        url: '/admin/actions/clear-cache',
    },
    {
        key: 'logout-all',
        title: 'Keluarkan Semua Pengguna',
        description:
            'Memutus semua sesi login selain sesi Anda, termasuk "ingat saya". Gunakan saat ada indikasi akun disalahgunakan.',
        confirm:
            'Semua pengguna lain (operator dan user) akan langsung keluar dan harus login ulang. Anda diminta memasukkan kata sandi untuk konfirmasi. Lanjutkan?',
        destructive: true,
        url: '/admin/actions/logout-all',
    },
];

export function QuickActionsCard() {
    const [pending, setPending] = useState<Action | null>(null);
    const [processing, setProcessing] = useState(false);

    const run = () => {
        if (!pending) {
            return;
        }

        router.post(
            pending.url,
            {},
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
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
                    <CardTitle>Tindakan Cepat</CardTitle>
                    <CardDescription>
                        Khusus admin. Semua tindakan dicatat di Log Aktivitas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {ACTIONS.map((action) => (
                        <div
                            key={action.key}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium">
                                    {action.title}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                    {action.description}
                                </div>
                            </div>
                            <Button
                                variant={
                                    action.destructive
                                        ? 'destructive'
                                        : 'outline'
                                }
                                onClick={() => setPending(action)}
                            >
                                {action.key === 'logout-all' ? (
                                    <LogOut className="size-4" />
                                ) : (
                                    <Eraser className="size-4" />
                                )}
                                {action.title}
                            </Button>
                        </div>
                    ))}

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium">
                                Export Database
                            </div>
                            <div className="text-muted-foreground text-sm">
                                Mengunduh cadangan seluruh data (berkas .sql).
                                Berisi data pengguna, simpan di tempat aman.
                                Sesi login tidak ikut diekspor.
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            render={<a href="/admin/export-database" />}
                        >
                            <Database className="size-4" />
                            Export Database
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog
                open={pending !== null}
                onOpenChange={(open) => !open && setPending(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{pending?.title}</DialogTitle>
                        <DialogDescription>
                            {pending?.confirm}
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
                        <Button
                            variant={
                                pending?.destructive ? 'destructive' : 'default'
                            }
                            onClick={run}
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Ya, lanjutkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
