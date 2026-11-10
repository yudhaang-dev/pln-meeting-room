import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/shared/general/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import appearance from '@/routes/settings/account/appearance';
import notification from '@/routes/settings/account/notification';
import profile from '@/routes/settings/account/profile';
import security from '@/routes/settings/account/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profil',
        href: profile.edit(),
        icon: null,
    },
    {
        title: 'Keamanan',
        href: security.edit(),
        icon: null,
    },
    {
        title: 'Tampilan',
        href: appearance.edit(),
        icon: null,
    },
    {
        title: 'Notifikasi',
        href: notification.edit(),
        icon: null,
    },
];

export default function AccountSettingLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="px-4 py-6">
            <Heading
                title="Pengaturan"
                description="Kelola profil dan pengaturan akun Anda"
            />

            <div className="flex flex-col lg:flex-row lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav
                        className="flex flex-col space-x-0 space-y-1"
                        aria-label="Pengaturan"
                    >
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                nativeButton={false}
                                key={`${toUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                className={cn('w-full justify-start', {
                                    'bg-muted': isCurrentOrParentUrl(item.href),
                                })}
                                render={<Link href={item.href} />}
                            >
                                {item.icon && <item.icon className="h-4 w-4" />}
                                {item.title}
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className="flex-1 md:max-w-2xl">
                    <section className="max-w-xl space-y-12">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
