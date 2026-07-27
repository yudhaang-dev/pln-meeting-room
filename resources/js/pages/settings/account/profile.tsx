import { Head } from '@inertiajs/react';
import ProfileForm from '@/components/features/auth/profile-form';
import profile from '@/routes/settings/account/profile';

export default function AdminProfile() {
    return (
        <>
            <Head title="Profile settings" />
            <ProfileForm />
        </>
    );
}

AdminProfile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: profile.edit(),
        },
    ],
};
