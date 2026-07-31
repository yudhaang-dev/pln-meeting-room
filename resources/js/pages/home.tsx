import { Link } from '@inertiajs/react';
import {
    ChevronRightIcon,
    LayoutPanelLeftIcon,
    MonitorIcon,
} from 'lucide-react';
import { TopBar } from '@/components/shared/general/top-bar';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';

export default function Home() {
    return (
        <div className="flex min-h-svh w-full flex-col">
            <TopBar className="w-full gap-6 p-6" logoClass="max-h-12" />
            <main className="flex h-full w-full flex-1 items-center justify-center gap-6 p-6">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 lg:flex-row">
                    <Item
                        variant="outline"
                        className="w-full items-center bg-white shadow"
                        render={
                            <Link href="/dashboard">
                                <ItemMedia variant="icon">
                                    <LayoutPanelLeftIcon className="text-muted-foreground size-14" />
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle>Dasbor Pengguna</ItemTitle>
                                    <ItemDescription>
                                        Login dengan akun anda untuk booking dan
                                        manajemen data.
                                    </ItemDescription>
                                </ItemContent>
                                <ItemActions>
                                    <ChevronRightIcon className="size-4" />
                                </ItemActions>
                            </Link>
                        }
                    />
                    <Item
                        variant="outline"
                        className="w-full items-center bg-white shadow"
                        render={
                            <Link href="/display">
                                <ItemMedia variant="icon">
                                    <MonitorIcon className="text-muted-foreground size-14" />
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle>Display Launcher</ItemTitle>
                                    <ItemDescription>
                                        Pilih salah satu display untuk
                                        menampilkan pada signage.
                                    </ItemDescription>
                                </ItemContent>
                                <ItemActions>
                                    <ChevronRightIcon className="size-4" />
                                </ItemActions>
                            </Link>
                        }
                    />
                </div>
            </main>
        </div>
    );
}
