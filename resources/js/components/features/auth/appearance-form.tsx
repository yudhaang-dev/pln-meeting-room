import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/shared/theme/appearance-tabs';
import Heading from '@/components/shared/general/heading';

export default function AppearanceForm() {
    return (
        <>
            <h1 className="sr-only">Appearance settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Appearance settings"
                    description="Update the appearance settings for your account"
                />
                <AppearanceTabs />
            </div>
        </>
    );
}
