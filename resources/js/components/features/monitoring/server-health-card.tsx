import { CheckCircle2, CircleAlert, OctagonAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Status = 'ok' | 'warn' | 'error';

export type HealthData = {
    overall: Status;
    checks: { key: string; label: string; status: Status; detail: string }[];
    info: {
        php: string;
        laravel: string;
        environment: string;
        timezone: string;
        server_time: string;
        os: string;
    };
};

const OVERALL: Record<Status, { label: string; className: string }> = {
    ok: { label: 'Sehat', className: 'bg-green-100 text-green-700' },
    warn: { label: 'Perlu perhatian', className: 'bg-yellow-100 text-yellow-700' },
    error: { label: 'Bermasalah', className: 'bg-red-100 text-red-700' },
};

function StatusIcon({ status }: { status: Status }) {
    if (status === 'ok') {
        return <CheckCircle2 className="size-5 shrink-0 text-green-600" />;
    }

    if (status === 'warn') {
        return <CircleAlert className="size-5 shrink-0 text-yellow-600" />;
    }

    return <OctagonAlert className="size-5 shrink-0 text-red-600" />;
}

export function ServerHealthCard({ health }: { health: HealthData }) {
    const overall = OVERALL[health.overall];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kesehatan Server</CardTitle>
                <CardDescription>
                    PHP {health.info.php} · Laravel {health.info.laravel} ·{' '}
                    {health.info.os} · lingkungan {health.info.environment}
                </CardDescription>
                <CardAction>
                    <Badge className={cn('border-0', overall.className)}>
                        {overall.label}
                    </Badge>
                </CardAction>
            </CardHeader>
            <CardContent>
                <ul className="divide-y">
                    {health.checks.map((check) => (
                        <li
                            key={check.key}
                            className="flex items-start gap-3 py-2.5"
                        >
                            <StatusIcon status={check.status} />
                            <div className="min-w-0">
                                <div className="text-sm font-medium">
                                    {check.label}
                                </div>
                                <div
                                    className={cn(
                                        'text-sm',
                                        check.status === 'error'
                                            ? 'text-red-700'
                                            : check.status === 'warn'
                                              ? 'text-yellow-700'
                                              : 'text-muted-foreground',
                                    )}
                                >
                                    {check.detail}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
                <p className="text-muted-foreground mt-2 text-xs">
                    Waktu server: {health.info.server_time} (
                    {health.info.timezone})
                </p>
            </CardContent>
        </Card>
    );
}
