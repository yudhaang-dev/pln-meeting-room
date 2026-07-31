import type { ComponentProps } from 'react';
import { PlnLogo } from './pln-logo';

export function AppLogo({ ...props }: ComponentProps<'img'>) {
    return <PlnLogo {...props} />;
}
