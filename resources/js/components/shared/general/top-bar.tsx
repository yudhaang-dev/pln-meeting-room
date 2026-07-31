import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { DanantaraLogo, PlnLogo } from '../brand/pln-logo';

export function TopBar({
    logoClass = 'h-auto',
    className,
    ...props
}: { logoClass?: string } & ComponentProps<'div'>) {
    return (
        <div
            {...props}
            className={cn(
                'flex w-full flex-row items-center justify-between gap-4 overflow-hidden p-4',
                className,
            )}
        >
            <div className="max-w-1/2 h-auto">
                <DanantaraLogo className={logoClass} />
            </div>
            <div className="max-w-1/2 h-auto">
                <PlnLogo className={logoClass} />
            </div>
        </div>
    );
}
