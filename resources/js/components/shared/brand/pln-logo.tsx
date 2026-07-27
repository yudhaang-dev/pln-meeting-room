import type { ComponentProps } from 'react';
import PlnIcon from '@/../assets/images/pln-icon.png';
import { cn } from '@/lib/utils';

export function PlnLogo({ className }: ComponentProps<'div'>) {
    return (
        <div className={cn('flex flex-row items-center gap-4', className)}>
            <img src={PlnIcon} alt="Pln Logo Icon" className="size-20" />
            <div className="flex w-full flex-col text-xl font-bold">
                <div className="text-pln-blue flex w-full flex-1 flex-row gap-4 text-4xl leading-5">
                    <span className="w-auto text-left">P</span>
                    <span className="w-auto text-left">L</span>
                    <span className="w-auto text-left">N</span>
                </div>
                <div className="w-full text-justify text-gray-800">
                    UPK Tarahan
                </div>
            </div>
        </div>
    );
}
