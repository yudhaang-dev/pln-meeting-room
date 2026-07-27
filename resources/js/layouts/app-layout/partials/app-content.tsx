import * as React from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import type { AppVariant } from '@/types';

type Props = React.ComponentProps<'main'> & {
    variant?: AppVariant;
};

export function AppContent({ children, ...props }: Props) {
    return <SidebarInset {...props}>{children}</SidebarInset>;
}
