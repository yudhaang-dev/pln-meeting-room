import Heading from '@/components/shared/general/heading';
import AppearanceTabs from '@/components/shared/theme/appearance-tabs';

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
