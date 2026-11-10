import { Head, Link } from '@inertiajs/react';
import { UpcomingTable } from '@/components/features/meeting-room/upcoming-table';
import type { UpcomingBooking } from '@/components/features/meeting-room/upcoming-table';
import { PageContainer } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type RoomRow = {
    id: number;
    name: string;
    capacity: number;
    building: string | null;
    upcoming_total: number;
    upcoming: UpcomingBooking[];
};

type Props = { rooms: RoomRow[]; previewLimit: number };

export default function MeetingRoomsIndex({ rooms, previewLimit }: Props) {
    return (
        <>
            <Head title="Ruang Rapat" />
            <PageContainer>
                <h1 className="text-2xl font-bold">Ruang Rapat</h1>

                {rooms.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                        Belum ada ruangan aktif.
                    </p>
                )}

                {rooms.map((room) => (
                    <Card key={room.id} className="gap-0 pb-0">
                        <CardHeader>
                            <CardTitle className="text-base">
                                {room.name}
                            </CardTitle>
                            <CardDescription>
                                {room.building ?? '-'} · Kapasitas{' '}
                                {room.capacity} orang
                            </CardDescription>
                            {room.upcoming_total > previewLimit && (
                                <CardAction>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        render={
                                            <Link
                                                href={`/meeting-rooms/${room.id}`}
                                            />
                                        }
                                    >
                                        Selengkapnya ({room.upcoming_total})
                                    </Button>
                                </CardAction>
                            )}
                        </CardHeader>
                        <CardContent className="px-0">
                            <UpcomingTable items={room.upcoming} />
                        </CardContent>
                    </Card>
                ))}
            </PageContainer>
        </>
    );
}
