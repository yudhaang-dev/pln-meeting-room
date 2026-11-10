import { Head } from '@inertiajs/react';
import type { Props as ManagePasskeysProps } from '@/components/features/auth/manage-passkeys';
import SecurityForm from '@/components/features/auth/security-form';
import security from '@/routes/settings/account/security';

type Props = {
    passwordRules: string;
} & ManagePasskeysProps;

export default function AdminSecurity(props: Props) {
    return (
        <>
            <Head title="Pengaturan keamanan" />
            <SecurityForm
                action={security.password.update()}
                method="put"
                {...props}
            />
        </>
    );
}

AdminSecurity.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan keamanan',
            href: security.edit(),
        },
    ],
};
