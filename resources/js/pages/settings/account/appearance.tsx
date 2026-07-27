import { Head } from '@inertiajs/react';
import AppearanceForm from '@/components/features/auth/appearance-form';
import appearance from '@/routes/settings/account/appearance';

export default function AdminAppearance() {
    return (
        <>
            <Head title="Appearance settings" />
            <AppearanceForm />
        </>
    );
}

AdminAppearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: appearance.edit(),
        },
    ],
};
