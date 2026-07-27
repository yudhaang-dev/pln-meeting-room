import type { ReactNode } from 'react';

export default function DisplayLayout({ children }: { children: ReactNode }) {
    return (
        <div className="bg-kaluk-paku flex min-h-svh w-full bg-slate-200 bg-repeat">
            {children}
        </div>
    );
}
