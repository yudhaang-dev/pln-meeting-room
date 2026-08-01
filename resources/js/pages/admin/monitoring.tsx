import { Head, router } from '@inertiajs/react';
import { usePoll } from '@inertiajs/react';
import {
    Activity,
    Eraser,
    Play,
    Radio,
    RefreshCw,
    RotateCcw,
    Server,
    Square,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import {
    clearQueue,
    flushFailed,
    retryFailed,
    startReverb,
    startWorker,
    stopReverb,
    stopWorker,
} from '@/actions/App/Http/Controllers/Web/MonitoringController';
import { ServiceStatusCard } from '@/components/features/monitoring/service-status-card';
import { PageContainer } from '@/components/shared/page-container';
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
    running: boolean;
    pid: number;
};

type Props = {
    queue: QueueStatus;
    reverb: ReverbStatus;
    checked_at: string;
};

type ConfirmAction =
    'clearPending' | 'flushFailed' | 'stopWorker' | 'stopReverb';

const confirmConfig: Record<
    ConfirmAction,
    { title: string; description: string; confirmLabel: string }
> = {
    clearPending: {
        title: 'Clear Pending Jobs',
        description:
            'This will permanently delete all pending jobs from the queue. This action cannot be undone.',
        confirmLabel: 'Clear',
    },
    flushFailed: {
        title: 'Clear Failed Jobs',
        description:
            'This will permanently delete all failed jobs. This action cannot be undone.',
        confirmLabel: 'Clear',
    },
    stopWorker: {
        title: 'Stop Queue Worker',
        description:
            'A stop signal will be sent to all running queue workers. They will stop after finishing their current job.',
        confirmLabel: 'Stop',
    },
    stopReverb: {
        title: 'Stop Reverb Server',
        description:
            'The Reverb process started from this page will be terminated. Real-time features will go offline.',
        confirmLabel: 'Stop',
    },
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

type ProcessingAction = 'start' | 'retry' | 'startReverb' | ConfirmAction;

export default function Monitoring({ queue, reverb, checked_at }: Props) {
    const [refreshing, setRefreshing] = useState(false);
    const [processing, setProcessing] = useState<false | ProcessingAction>(
        false,
    );
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
        null,
    );

    usePoll(REFRESH_INTERVAL, { only: ['queue', 'reverb', 'checked_at'] });

    const reload = () => {
        setRefreshing(true);
        router.reload({
            only: ['queue', 'reverb', 'checked_at'],
            onFinish: () => setRefreshing(false),
        });
    };

    const post = (action: ProcessingAction, url: string) => {
        setProcessing(action);
        router.post(
            url,
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setConfirmAction(null);
                },
            },
        );
    };

    const confirm = confirmAction ? confirmConfig[confirmAction] : null;

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
                            Queue worker &amp; Reverb status &middot; last
                            checked {formatTime(checked_at)}
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

                <div className="grid gap-6 lg:grid-cols-2">
                    <ServiceStatusCard
                        title="Queue Worker"
                        description={`Driver: ${queue.driver}`}
                        icon={
                            <Server className="text-muted-foreground size-4" />
                        }
                        statusLabel={queue.worker.alive ? 'Alive' : 'Down'}
                        statusTone={queue.worker.alive ? 'ok' : 'error'}
                        rows={[
                            {
                                label: 'Pending Jobs',
                                value: queue.pending_jobs.toLocaleString(),
                            },
                            {
                                label: 'Failed Jobs',
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
                                label: 'Last Heartbeat',
                                value: queue.worker.last_heartbeat_at
                                    ? formatTime(queue.worker.last_heartbeat_at)
                                    : '—',
                            },
                        ]}
                    />

                    <ServiceStatusCard
                        title="Reverb"
                        description={reverb.url}
                        icon={
                            <Radio className="text-muted-foreground size-4" />
                        }
                        statusLabel={reverb.up ? 'Online' : 'Offline'}
                        statusTone={reverb.up ? 'ok' : 'error'}
                        rows={[
                            {
                                label: 'Connected Clients',
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
                            {
                                label: 'Process',
                                value:
                                    reverb.running && reverb.pid > 0
                                        ? `PID ${reverb.pid}`
                                        : '—',
                            },
                        ]}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                        <CardDescription>
                            Manage the queue worker and its jobs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        <Button
                            onClick={() => post('start', startWorker.url())}
                            disabled={
                                processing !== false || queue.worker.alive
                            }
                        >
                            {processing === 'start' ? (
                                <Spinner className="size-4" />
                            ) : (
                                <Play className="size-4" />
                            )}
                            <span className="ml-2">Start Worker</span>
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={() => setConfirmAction('stopWorker')}
                            disabled={
                                processing !== false || !queue.worker.alive
                            }
                        >
                            {processing === 'stopWorker' ? (
                                <Spinner className="size-4" />
                            ) : (
                                <Square className="size-4" />
                            )}
                            <span className="ml-2">Stop Worker</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => post('retry', retryFailed.url())}
                            disabled={
                                processing !== false || queue.failed_jobs === 0
                            }
                        >
                            {processing === 'retry' ? (
                                <Spinner className="size-4" />
                            ) : (
                                <RotateCcw className="size-4" />
                            )}
                            <span className="ml-2">Retry Failed Jobs</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => setConfirmAction('clearPending')}
                            disabled={
                                processing !== false || queue.pending_jobs === 0
                            }
                        >
                            {processing === 'clearPending' ? (
                                <Spinner className="size-4" />
                            ) : (
                                <Trash2 className="size-4" />
                            )}
                            <span className="ml-2">Clear Pending Jobs</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setConfirmAction('flushFailed')}
                            disabled={
                                processing !== false || queue.failed_jobs === 0
                            }
                        >
                            {processing === 'flushFailed' ? (
                                <Spinner className="size-4" />
                            ) : (
                                <Eraser className="size-4" />
                            )}
                            <span className="ml-2">Clear Failed Jobs</span>
                        </Button>

                        <span className="text-muted-foreground inline-flex w-full items-center gap-2 text-xs uppercase tracking-wide">
                            <span className="bg-border h-px flex-1" />
                            Reverb
                            <span className="bg-border h-px flex-1" />
                        </span>

                        <Button
                            onClick={() =>
                                post('startReverb', startReverb.url())
                            }
                            disabled={processing !== false || reverb.up}
                        >
                            {processing === 'startReverb' ? (
                                <Spinner className="size-4" />
                            ) : (
                                <Play className="size-4" />
                            )}
                            <span className="ml-2">Start Reverb</span>
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={() => setConfirmAction('stopReverb')}
                            disabled={processing !== false || !reverb.running}
                        >
                            {processing === 'stopReverb' ? (
                                <Spinner className="size-4" />
                            ) : (
                                <Square className="size-4" />
                            )}
                            <span className="ml-2">Stop Reverb</span>
                        </Button>
                    </CardContent>
                </Card>

                <Dialog
                    open={confirmAction !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setConfirmAction(null);
                        }
                    }}
                >
                    <DialogContent>
                        {confirm && (
                            <>
                                <DialogHeader>
                                    <DialogTitle>{confirm.title}</DialogTitle>
                                    <DialogDescription>
                                        {confirm.description}
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setConfirmAction(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        disabled={processing !== false}
                                        onClick={() => {
                                            const action = confirmAction;

                                            if (action === 'clearPending') {
                                                post(
                                                    'clearPending',
                                                    clearQueue.url(),
                                                );
                                            } else if (
                                                action === 'flushFailed'
                                            ) {
                                                post(
                                                    'flushFailed',
                                                    flushFailed.url(),
                                                );
                                            } else if (
                                                action === 'stopReverb'
                                            ) {
                                                post(
                                                    'stopReverb',
                                                    stopReverb.url(),
                                                );
                                            } else {
                                                post(
                                                    'stopWorker',
                                                    stopWorker.url(),
                                                );
                                            }
                                        }}
                                    >
                                        {processing !== false && <Spinner />}
                                        {confirm.confirmLabel}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
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
