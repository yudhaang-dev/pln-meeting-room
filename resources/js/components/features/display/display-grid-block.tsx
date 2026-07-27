'use client';

import type { ComponentProps, ReactNode } from 'react';
import {
    Card,
    CardAction,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Item {
    id: number;
    name: string;
    building: {
        name: string;
    };
}

type Props = {
    items: Item[];
    renderCardAction?: (item: Item) => ReactNode;
} & ComponentProps<'div'>;

export function DisplayGridBlock({
    className,
    items,
    renderCardAction,
}: Props) {
    return (
        <div
            className={cn(
                'grid gap-4 sm:grid-cols-3 lg:grid-cols-4',
                className,
            )}
        >
            {items.map((item, index) => (
                <Card key={`item-${item.id}-${index}`}>
                    <CardHeader>
                        {renderCardAction && (
                            <CardAction>{renderCardAction(item)}</CardAction>
                        )}
                        <CardTitle>{item.name}</CardTitle>
                        <CardDescription>
                            {item?.building?.name ?? ''}
                        </CardDescription>
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}
