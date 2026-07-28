import type { ComponentProps } from 'react';

export default function DisplayLayout({ children }: ComponentProps<'div'>) {
    return (
        <div className="bg-kaluk-paku min-h-svh w-full bg-slate-200 bg-auto">
            {children}
        </div>
    );
}
