import Heading from '@/components/shared/general/heading';
import AppearanceTabs from '@/components/shared/theme/appearance-tabs';

export default function AppearanceForm() {
    return (
        <>
            <h1 className="sr-only">Pengaturan tampilan</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Pengaturan tampilan"
                    description="Ubah pengaturan tampilan akun Anda"
                />
                <AppearanceTabs />
            </div>
        </>
    );
}
