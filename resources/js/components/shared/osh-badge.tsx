import { cn } from '@/lib/utils';

type OshLevel = {
    name: string;
    color: string;
};

type OshBadgeProps = {
    level: OshLevel;
    variant?: 'light' | 'solid';
    showLabel?: boolean;
};

export function OshBadge({ level, variant = 'light', showLabel = false }: OshBadgeProps) {
    if (variant === 'solid') {
        return (
            <span
                className="mb-4 inline-flex rounded-full px-4 py-1 text-sm font-bold text-white"
                style={{ backgroundColor: level.color }}
            >
                {showLabel && 'OSH: '}{level.name}
            </span>
        );
    }

    return (
        <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
                backgroundColor: level.color + '20',
                color: level.color,
            }}
        >
            {level.name}
        </span>
    );
}
