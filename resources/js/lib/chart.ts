import type { ChartConfig } from '@/components/ui/chart';

export const CHART_PALETTE = [
    '#3b82f6',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#f43f5e',
    '#10b981',
] as const;

export const STATUS_LABELS: Record<string, string> = {
    approved: 'Disetujui',
    rejected: 'Ditolak',
    pending: 'Menunggu',
    cancelled: 'Dibatalkan',
};

export const STATUS_COLORS: Record<string, string> = {
    approved: '#22c55e',
    rejected: '#ef4444',
    pending: '#f59e0b',
};

export function statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
}

export type ChartSeries = {
    key: string;
    label: string;
    color?: string;
};

export function chartConfig(series: ChartSeries[]): ChartConfig {
    const config: ChartConfig = {};

    series.forEach((item, index) => {
        config[item.key] = {
            label: item.label,
            color: item.color ?? CHART_PALETTE[index % CHART_PALETTE.length],
        };
    });

    return config;
}

const numberFormatter = new Intl.NumberFormat('id-ID');

export function formatNumber(value: number): string {
    return numberFormatter.format(value);
}
