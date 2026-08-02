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
        { name: 'Background worker', running: workerRunning },
        { name: 'WebSocket server', running: reverbRunning },
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
                            ? 'All services are running'
                            : `${down.length} service${down.length > 1 ? 's' : ''} need${down.length > 1 ? '' : 's'} attention`}
                    </p>
                    <p className="text-muted-foreground text-sm">
                        {allRunning
                            ? 'Background worker and WebSocket server are active.'
                            : `${down.map((service) => service.name).join(' and ')} ${down.length > 1 ? 'are' : 'is'} not running.`}
                    </p>
                </div>
            </div>
        </div>
    );
}
