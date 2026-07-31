import { useFlashToast } from '@/hooks/use-flash-toast';
import AuthCardLayout from './variants/auth-card-layout';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    useFlashToast();

    return (
        <AuthCardLayout title={title} description={description}>
            {children}
        </AuthCardLayout>
    );
}
