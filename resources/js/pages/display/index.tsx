import type { PageProps } from '@inertiajs/core';
import { Head, Link } from '@inertiajs/react';
import { MonitorIcon, TabletIcon } from 'lucide-react';
import { TopBar } from '@/components/shared/general/top-bar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Media = {
    id: number;
    type: string;
    file_url: string;
};

type RoomGroup = {
    id: number;
    name: string;
    building: { id: number; name: string };
    media: Media[];
    rooms: { id: number; name: string }[];
};

type Room = {
    id: number;
    name: string;
    building: { id: number; name: string };
    media: Media[];
};

type Props = PageProps & {
    roomGroups: RoomGroup[];
    rooms: Room[];
};

function CardItem({
    title,
    description,
    href,
}: {
    title: string;
    description: string;
    href: string;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
                <CardAction className="flex flex-col gap-2">
                    <Button
                        nativeButton={false}
                        variant="outline"
                        render={<Link href={`${href}?orientation=portrait`} />}
                    >
                        <TabletIcon /> Portrait
                    </Button>
                    <Button
                        nativeButton={false}
                        variant="outline"
                        render={<Link href={`${href}?orientation=landscape`} />}
                    >
                        <MonitorIcon /> Landscape
                    </Button>
                </CardAction>
            </CardHeader>
        </Card>
    );
}

export default function DisplayIndex({ roomGroups, rooms }: Props) {
    return (
        <>
            <Head title="Display Launcher" />
            <div className="bg-kaluk-paku flex min-h-svh w-full flex-col bg-slate-200 bg-auto">
                <TopBar className="w-full gap-6 p-6" logoClass="max-h-12" />
                <main className="flex h-full w-full flex-1 flex-col items-center justify-center p-6">
                    <div className="mx-auto w-full max-w-7xl px-6 py-6">
                        <h1 className="mb-2 text-3xl font-bold">
                            Display Launcher
                        </h1>
                        <p className="mb-10 text-gray-500">
                            Select a display to launch in full-screen kiosk
                            mode.
                        </p>
                        <h2 className="mb-4 text-xl font-semibold">
                            Lobby Displays
                        </h2>
                        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {roomGroups.map((group, index) => (
                                <CardItem
                                    key={`display-lobby-${index}`}
                                    title={group.name}
                                    description={group.building?.name}
                                    href={`/display/lobby/${group.id}`}
                                />
                            ))}
                        </div>

                        <h2 className="mb-4 text-xl font-semibold">
                            Room Displays
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {rooms.map((room, index) => (
                                <CardItem
                                    key={`display-room-${index}`}
                                    title={room.name}
                                    description={room.building?.name}
                                    href={`/display/room/${room.id}`}
                                />
                            ))}
                        </div>

                        <h2 className="mb-4 mt-10 text-xl font-semibold">
                            OSH Display
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <CardItem
                                title="OSH Display"
                                description="Support display"
                                href={`/display/osh`}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
