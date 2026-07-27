import { Link, router } from '@inertiajs/react';
import { LogOut, Palette, ShieldCheck, UserCog } from 'lucide-react';
import { UserInfo } from '@/components/features/profile/user-info';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import appearance from '@/routes/settings/account/appearance';
import profile from '@/routes/settings/account/profile';
import security from '@/routes/settings/account/security';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <UserInfo user={user} showEmail={true} />
                    </div>
                </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem
                    nativeButton={true}
                    render={
                        <Link
                            className="block w-full cursor-pointer"
                            as="button"
                            href={profile.edit()}
                            prefetch
                            onClick={cleanup}
                        >
                            <UserCog className="mr-2" />
                            Profile
                        </Link>
                    }
                />
                <DropdownMenuItem
                    nativeButton={true}
                    render={
                        <Link
                            className="block w-full cursor-pointer"
                            as="button"
                            href={security.edit()}
                            prefetch
                            onClick={cleanup}
                        >
                            <ShieldCheck className="mr-2" />
                            Security
                        </Link>
                    }
                />
                <DropdownMenuItem
                    nativeButton={true}
                    render={
                        <Link
                            className="block w-full cursor-pointer"
                            as="button"
                            href={appearance.edit()}
                            prefetch
                            onClick={cleanup}
                        >
                            <Palette className="mr-2" />
                            Appearance
                        </Link>
                    }
                />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                nativeButton={true}
                render={
                    <Link
                        className="block w-full cursor-pointer"
                        href={logout()}
                        as="button"
                        onClick={handleLogout}
                        data-test="logout-button"
                    >
                        <LogOut className="mr-2" />
                        Log out
                    </Link>
                }
            />
        </>
    );
}
