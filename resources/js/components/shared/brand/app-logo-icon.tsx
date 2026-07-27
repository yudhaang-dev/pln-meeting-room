import type { ComponentProps } from 'react';
import LogoIcon from '@/../assets/images/pln-icon.png';
import { cn } from '@/lib/utils';

export default function AppLogoIcon({
    className,
    ...props
}: ComponentProps<'img'>) {
    return (
        <img
            src={LogoIcon}
            className={cn('h-20', className)}
            title="Logo"
            {...props}
        />
    );
}
