import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatusTone = 'ok' | 'error' | 'warning' | 'idle';

type Row = {
    label: string;
    value: ReactNode;
};

type ServiceStatusCardProps = {
    title: string;
    description?: string;
    icon: ReactNode;
    statusLabel: string;
    statusTone: StatusTone;
    rows: Row[];
};

const statusColors: Record<StatusTone, string> = {
    ok: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    warning: 'bg-yellow-100 text-yellow-700',
    idle: 'bg-gray-100 text-gray-600',
};

export function ServiceStatusCard({
    title,
    description,
    icon,
    statusLabel,
    statusTone,
    rows,
}: ServiceStatusCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                        {icon}
                        {title}
                    </CardTitle>
                    {description && (
                        <CardDescription>{description}</CardDescription>
                    )}
                </div>
                <Badge className={cn(statusColors[statusTone])}>
                    {statusLabel}
                </Badge>
            </CardHeader>
            <CardContent>
                <dl className="space-y-2">
                    {rows.map((row) => (
                        <div
                            key={row.label}
                            className="flex items-center justify-between gap-2 text-sm"
                        >
                            <dt className="text-muted-foreground">
                                {row.label}
                            </dt>
                            <dd className="font-medium">{row.value}</dd>
                        </div>
                    ))}
                </dl>
            </CardContent>
        </Card>
    );
}
