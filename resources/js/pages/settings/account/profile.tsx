import { Head } from '@inertiajs/react';
import ProfileForm from '@/components/features/auth/profile-form';
import profile from '@/routes/settings/account/profile';

export default function AdminProfile() {
    return (
        <>
            <Head title="Pengaturan profil" />
            <ProfileForm />
        </>
    );
}

AdminProfile.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan profil',
            href: profile.edit(),
        },
    ],
};
