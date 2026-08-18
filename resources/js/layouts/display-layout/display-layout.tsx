import type { ComponentProps } from 'react';
import { useFlashToast } from '@/hooks/use-flash-toast';

export default function DisplayLayout({ children }: ComponentProps<'div'>) {
    useFlashToast();

    return <>{children}</>;
}
