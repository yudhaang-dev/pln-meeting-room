import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ComponentProps } from 'react';
import { TableHead } from '@/components/ui/table';

type SortableHeaderProps = {
    column: string;
    sortBy: string;
    sortDirection: string;
    onSort: (column: string) => void;
} & ComponentProps<typeof TableHead>;

export function SortableHeader({
    column,
    sortBy,
    sortDirection,
    onSort,
    children,
}: SortableHeaderProps) {
    return (
        <TableHead
            className="hover:text-foreground cursor-pointer select-none"
            onClick={() => onSort(column)}
        >
            <div className="flex items-center gap-1">
                {children}
                {sortBy === column ? (
                    sortDirection === 'asc' ? (
                        <ArrowUp className="size-3" />
                    ) : (
                        <ArrowDown className="size-3" />
                    )
                ) : null}
            </div>
        </TableHead>
    );
}
