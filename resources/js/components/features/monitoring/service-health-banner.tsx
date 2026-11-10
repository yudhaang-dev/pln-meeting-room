import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ServiceHealthBannerProps = {
    workerRunning: boolean;
    reverbRunning: boolean;
};

export function ServiceHealthBanner({
    workerRunning,
    reverbRunning,
}: ServiceHealthBannerProps) {
    const services = [
        { name: 'Pekerja latar belakang', running: workerRunning },
        { name: 'Server WebSocket', running: reverbRunning },
    ];

    const down = services.filter((service) => !service.running);
    const allRunning = down.length === 0;

    return (
        <div
            className={cn(
                'flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between',
                allRunning
                    ? 'border-green-200 bg-green-50'
                    : 'border-amber-200 bg-amber-50',
            )}
        >
            <div className="flex items-center gap-3">
                {allRunning ? (
                    <CheckCircle2 className="size-6 text-green-600" />
                ) : (
                    <AlertTriangle className="size-6 text-amber-600" />
                )}
                <div>
                    <p
                        className={cn(
                            'font-semibold',
                            allRunning ? 'text-green-800' : 'text-amber-800',
                        )}
                    >
                        {allRunning
                            ? 'Semua layanan berjalan'
                            : `${down.length} layanan perlu perhatian`}
                    </p>
                    <p className="text-muted-foreground text-sm">
                        {allRunning
                            ? 'Pekerja latar belakang dan server WebSocket aktif.'
                            : `${down.map((service) => service.name).join(' dan ')} tidak berjalan.`}
                    </p>
                </div>
            </div>
        </div>
    );
}
