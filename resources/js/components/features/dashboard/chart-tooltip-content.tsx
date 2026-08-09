import type { DefaultTooltipContentProps, TooltipValueType } from 'recharts';
import { formatNumber } from '@/lib/chart';

type TooltipNameType = number | string;

type TooltipFormatter = NonNullable<
    DefaultTooltipContentProps<TooltipValueType, TooltipNameType>['formatter']
>;

type ChartTooltipFormatterOptions = {
    labels?: Record<string, string>;
    valueFormatter?: (value: number) => string;
};

export function chartTooltipFormatter({
    labels = {},
    valueFormatter = formatNumber,
}: ChartTooltipFormatterOptions = {}): TooltipFormatter {
    return (value, name) => {
        const key = name != null ? String(name) : '';
        const label = labels[key] ?? key;

        return (
            <div className="flex w-full items-center justify-between gap-2">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground font-mono font-medium tabular-nums">
                    {valueFormatter(Number(value ?? 0))}
                </span>
            </div>
        );
    };
}
