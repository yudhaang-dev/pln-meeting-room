import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';

export function TableEmpty({
    colSpan,
    icon: Icon = Inbox,
    title,
    description,
}: {
    colSpan: number;
    icon?: LucideIcon;
    title: string;
    description?: string;
}) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan}>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Icon className="text-muted-foreground mb-4 size-10" />
                    <p className="text-muted-foreground text-sm font-medium">{title}</p>
                    {description && (
                        <p className="text-muted-foreground mt-1 text-xs">{description}</p>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}
