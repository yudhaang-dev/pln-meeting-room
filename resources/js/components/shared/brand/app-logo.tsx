import type { ComponentProps } from 'react';
import LogoImage from '@/../assets/images/pln-logo.png';
import { cn } from '@/lib/utils';

export default function AppLogo({
    className,
    ...props
}: ComponentProps<'img'>) {
    return (
        <img
            src={LogoImage}
            className={cn('h-20', className)}
            title="Logo"
            {...props}
        />
    );
}
