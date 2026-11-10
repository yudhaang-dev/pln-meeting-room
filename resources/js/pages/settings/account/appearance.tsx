import { Head } from '@inertiajs/react';
import AppearanceForm from '@/components/features/auth/appearance-form';
import appearance from '@/routes/settings/account/appearance';

export default function AdminAppearance() {
    return (
        <>
            <Head title="Pengaturan tampilan" />
            <AppearanceForm />
        </>
    );
}

AdminAppearance.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan tampilan',
            href: appearance.edit(),
        },
    ],
};
