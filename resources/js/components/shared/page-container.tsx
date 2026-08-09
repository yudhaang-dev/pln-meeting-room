import { cn } from '@/lib/utils';

type PageContainerProps = {
    children: React.ReactNode;
    className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
    return (
        <div
            className={cn(
                'flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6',
                className,
            )}
        >
            {children}
        </div>
    );
}
