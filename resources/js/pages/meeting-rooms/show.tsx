import { Head, Link } from '@inertiajs/react';
import { UpcomingTable } from '@/components/features/meeting-room/upcoming-table';
import type { UpcomingBooking } from '@/components/features/meeting-room/upcoming-table';
import { PageContainer } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Props = {
    room: {
        id: number;
        name: string;
        capacity: number;
        building: string | null;
    };
    bookings: UpcomingBooking[];
};

export default function MeetingRoomShow({ room, bookings }: Props) {
    return (
        <>
            <Head title={room.name} />
            <PageContainer>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{room.name}</h1>
                    <Button
                        variant="outline"
                        render={<Link href="/meeting-rooms" />}
                    >
                        Kembali
                    </Button>
                </div>
                <Card className="gap-0 pb-0">
                    <CardHeader>
                        <CardTitle className="text-base">
                            Rapat Mendatang
                        </CardTitle>
                        <CardDescription>
                            {room.building ?? '-'} · Kapasitas {room.capacity}{' '}
                            orang · {bookings.length} rapat
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                        <UpcomingTable items={bookings} />
                    </CardContent>
                </Card>
            </PageContainer>
        </>
    );
}
