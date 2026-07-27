import { router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RouteDefinition } from '@/wayfinder';

type PageHeaderProps = {
    title: string;
    backHref?: string | RouteDefinition<'get'>;
    children?: React.ReactNode;
};

export function PageHeader({ title, backHref, children }: PageHeaderProps) {
    return (
        <div className="flex items-center gap-3">
            {backHref && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.get(backHref)}
                >
                    <ArrowLeft className="size-4" />
                </Button>
            )}
            <h1 className="text-2xl font-bold">{title}</h1>
            {children}
        </div>
    );
}
