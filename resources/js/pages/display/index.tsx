import type { PageProps } from '@inertiajs/core';
import { Head, Link } from '@inertiajs/react';

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

export default function DisplayIndex({ roomGroups, rooms }: Props) {
    return (
        <>
            <Head title="Display Launcher" />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="mx-auto max-w-7xl px-6 py-12">
                    <h1 className="mb-2 text-3xl font-bold">
                        Display Launcher
                    </h1>
                    <p className="mb-10 text-gray-500">
                        Select a display to launch in full-screen kiosk mode.
                    </p>

                    <h2 className="mb-4 text-xl font-semibold">
                        Lobby Displays
                    </h2>
                    <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {roomGroups.map((group) => (
                            <div
                                key={group.id}
                                className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                            >
                                <h3 className="mb-1 text-lg font-semibold">
                                    {group.name}
                                </h3>
                                <p className="mb-3 text-sm text-gray-500">
                                    {group.building.name} — {group.rooms.length}{' '}
                                    rooms
                                </p>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/display/lobby/${group.id}?orientation=landscape`}
                                        target="_blank"
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                    >
                                        Landscape
                                    </Link>
                                    <Link
                                        href={`/display/lobby/${group.id}?orientation=portrait`}
                                        target="_blank"
                                        className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                    >
                                        Portrait
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    <h2 className="mb-4 text-xl font-semibold">
                        Room Displays
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {rooms.map((room) => (
                            <div
                                key={room.id}
                                className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                            >
                                <h3 className="mb-1 text-lg font-semibold">
                                    {room.name}
                                </h3>
                                <p className="mb-3 text-sm text-gray-500">
                                    {room.building.name}
                                </p>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/display/room/${room.id}?orientation=landscape`}
                                        target="_blank"
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                    >
                                        Landscape
                                    </Link>
                                    <Link
                                        href={`/display/room/${room.id}?orientation=portrait`}
                                        target="_blank"
                                        className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                    >
                                        Portrait
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    <h2 className="mb-4 mt-10 text-xl font-semibold">
                        OSH Display
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h3 className="mb-1 text-lg font-semibold">
                                OSH Monitoring
                            </h3>
                            <p className="mb-3 text-sm text-gray-500">
                                Today &amp; tomorrow bookings
                            </p>
                            <div className="flex gap-2">
                                <Link
                                    href="/display/osh?orientation=landscape"
                                    target="_blank"
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    Landscape
                                </Link>
                                <Link
                                    href="/display/osh?orientation=portrait"
                                    target="_blank"
                                    className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                >
                                    Portrait
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
