import type { ComponentProps } from 'react';
import { TopBar } from '@/components/shared/general/top-bar';
import { useFlashToast } from '@/hooks/use-flash-toast';

export default function DisplayLayout({ children }: ComponentProps<'div'>) {
    useFlashToast();

    return (
        <div className="flex min-h-svh w-full flex-col">
            <TopBar className="w-full gap-6 p-6" logoClass="max-h-12" />
            {children}
        </div>
    );
}
