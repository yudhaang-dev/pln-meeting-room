import type { ReactNode } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ChartCardProps = {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
};

export function ChartCard({
    title,
    description,
    action,
    children,
    className,
}: ChartCardProps) {
    return (
        <Card className={cn('flex min-h-0 flex-col', className)}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base">{title}</CardTitle>
                    {description ? (
                        <CardDescription>{description}</CardDescription>
                    ) : null}
                </div>
                {action}
            </CardHeader>
            <CardContent className="min-h-0 flex-1">{children}</CardContent>
        </Card>
    );
}
