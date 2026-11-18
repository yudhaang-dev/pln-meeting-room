import { cn } from '@/lib/utils';

type StatusBadgeProps = {
    label: string;
    variant?: 'status' | 'role' | 'active';
    value?: string;
};

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

const statusText: Record<string, string> = {
    pending: 'Pending',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    cancelled: 'Dibatalkan',
};

const roleColors: Record<string, string> = {
    admin: 'bg-blue-100 text-blue-700',
    operator: 'bg-purple-100 text-purple-700',
};

export function StatusBadge({
    label,
    variant = 'status',
    value,
}: StatusBadgeProps) {
    let color: string;

    if (variant === 'active') {
        color =
            value === 'true' || value === '1'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600';
    } else if (variant === 'role') {
        color = roleColors[label] ?? 'bg-gray-100 text-gray-600';
    } else {
        color = statusColors[label] ?? 'bg-gray-100 text-gray-600';
    }

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium uppercase',
                color,
            )}
        >
            {variant === 'status' ? (statusText[label] ?? label) : label}
        </span>
    );
}
