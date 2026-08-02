import { Head, router } from '@inertiajs/react';
import { usePoll } from '@inertiajs/react';
import { Activity, Radio, RefreshCw, Server } from 'lucide-react';
import { useState } from 'react';
import { ServiceHealthBanner } from '@/components/features/monitoring/service-health-banner';
import { ServiceStatusCard } from '@/components/features/monitoring/service-status-card';
import { PageContainer } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn, formatTime } from '@/lib/utils';

const REFRESH_INTERVAL = 30_000;

type WorkerStatus = {
    alive: boolean;
    last_heartbeat_at: string | null;
};

type QueueStatus = {
    driver: string;
    pending_jobs: number;
    failed_jobs: number;
    worker: WorkerStatus;
};

type ReverbStatus = {
    up: boolean;
    url: string;
    connected_clients: number | null;
    uptime_seconds: number | null;
    up_since: string | null;
};

type Props = {
    queue: QueueStatus;
    reverb: ReverbStatus;
    checked_at: string;
};

function formatUptime(totalSeconds: number): string {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];

    if (days > 0) {
        parts.push(`${days}d`);
    }

    if (hours > 0) {
        parts.push(`${hours}h`);
    }

    if (minutes > 0) {
        parts.push(`${minutes}m`);
    }

    if (parts.length === 0) {
        parts.push(`${seconds}s`);
    }

    return parts.join(' ');
}

export default function Monitoring({ queue, reverb, checked_at }: Props) {
    const [refreshing, setRefreshing] = useState(false);

    usePoll(REFRESH_INTERVAL, { only: ['queue', 'reverb', 'checked_at'] });

    const reload = () => {
        setRefreshing(true);
        router.reload({
            only: ['queue', 'reverb', 'checked_at'],
            onFinish: () => setRefreshing(false),
        });
    };

    return (
        <>
            <Head title="Monitoring" />

            <PageContainer>
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold">
                            <Activity className="size-6" />
                            Service Monitoring
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Background worker &amp; WebSocket server &middot;
                            last checked {formatTime(checked_at)}
                        </p>
                    </div>
                    <Button onClick={reload} disabled={refreshing}>
                        {refreshing ? (
                            <Spinner className="size-4" />
                        ) : (
                            <RefreshCw className="size-4" />
                        )}
                        <span className="ml-2">Refresh</span>
                    </Button>
                </div>

                <ServiceHealthBanner
                    workerRunning={queue.worker.alive}
                    reverbRunning={reverb.up}
                />

                <div className="grid gap-6 lg:grid-cols-2">
                    <ServiceStatusCard
                        title="Background Worker"
                        description="Queue worker — processes background jobs like notifications."
                        icon={
                            <Server className="text-muted-foreground size-4" />
                        }
                        statusLabel={queue.worker.alive ? 'Running' : 'Stopped'}
                        statusTone={queue.worker.alive ? 'ok' : 'error'}
                        rows={[
                            {
                                label: 'Jobs Waiting',
                                value: queue.pending_jobs.toLocaleString(),
                            },
                            {
                                label: 'Jobs Failed',
                                value: (
                                    <span
                                        className={cn(
                                            queue.failed_jobs > 0 &&
                                                'text-red-600',
                                        )}
                                    >
                                        {queue.failed_jobs.toLocaleString()}
                                    </span>
                                ),
                            },
                            {
                                label: 'Last Seen',
                                value: queue.worker.last_heartbeat_at
                                    ? formatTime(queue.worker.last_heartbeat_at)
                                    : '—',
                            },
                        ]}
                    />

                    <ServiceStatusCard
                        title="WebSocket Server"
                        description="Reverb — sends real-time updates to displays."
                        icon={
                            <Radio className="text-muted-foreground size-4" />
                        }
                        statusLabel={reverb.up ? 'Running' : 'Stopped'}
                        statusTone={reverb.up ? 'ok' : 'error'}
                        rows={[
                            {
                                label: 'Devices Connected',
                                value:
                                    reverb.connected_clients !== null
                                        ? reverb.connected_clients.toLocaleString()
                                        : '—',
                            },
                            {
                                label: 'Uptime',
                                value:
                                    reverb.uptime_seconds !== null
                                        ? formatUptime(reverb.uptime_seconds)
                                        : '—',
                            },
                            {
                                label: 'Up Since',
                                value: reverb.up_since
                                    ? formatTime(reverb.up_since)
                                    : '—',
                            },
                        ]}
                    />
                </div>
            </PageContainer>
        </>
    );
}

Monitoring.layout = {
    breadcrumbs: [
        {
            title: 'Monitoring',
            href: '/admin/monitoring',
        },
    ],
};
