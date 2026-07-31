import type { ComponentProps } from 'react';
import ImageDanantara from '@/../assets/images/danantara-logo.png';
import ImageLogo from '@/../assets/images/nusantara-power-logo.png';
import ImageIcon from '@/../assets/images/pln-icon.png';

import { cn } from '@/lib/utils';

export function PlnLogo({ className, ...props }: ComponentProps<'img'>) {
    return (
        <img
            src={ImageLogo}
            alt="PLN Nusatara Power Logo"
            {...props}
            className={cn('h-auto max-h-20 w-auto', className)}
        />
    );
}

export function DanantaraLogo({ className, ...props }: ComponentProps<'img'>) {
    return (
        <img
            src={ImageDanantara}
            alt="Danantara Logo"
            {...props}
            className={cn('h-auto max-h-20 w-auto', className)}
        />
    );
}

export function PlnIcon({ className, ...props }: ComponentProps<'img'>) {
    return (
        <img
            src={ImageIcon}
            alt="PLN Icon"
            {...props}
            className={cn('h-auto max-h-20 w-auto', className)}
        />
    );
}
