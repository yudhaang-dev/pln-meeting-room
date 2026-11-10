import { Head, usePage } from '@inertiajs/react';
import { CalendarPlus } from 'lucide-react';
import { BookingDataTable } from '@/components/features/booking/booking-data-table';
import { BookingForm } from '@/components/features/booking/booking-form';
import { PageContainer } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { useCrudIndex } from '@/hooks/use-crud-index';
import type { PaginatedData } from '@/lib/utils';
import bookings from '@/routes/bookings';

type Room = { id: number; name: string; capacity: number };
type Person = { id: number; name: string };

type Booking = {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    status: string;
    participants_count: number;
    room: { id: number; name: string; building: { id: number; name: string } };
    requested_by: { id: number; name: string };
    approved_by: { id: number; name: string };
    chairperson: { name: string };
    osh_level: { name: string; color: string } | null;
};

type Props = {
    bookings: PaginatedData<Booking>;
    rooms: Room[];
    people: Person[];
    osh_levels: { id: number; name: string; color: string }[];
};

export default function BookingsIndex({
    bookings: paginatedData,
    rooms,
    people,
    osh_levels,
}: Props) {
    const allowCreate = usePage().props.auth.user.role == 'user';

    const {
        search,
        sortBy,
        sortDirection,
        perPage,
        status,
        dialogOpen,
        navigate,
        handleSort,
        openCreate,
        closeDialog,
    } = useCrudIndex({
        indexRoute: bookings.index().url,
        defaultSortBy: 'start_time',
        defaultSortDirection: 'desc',
        defaultPerPage: '10',
    });

    return (
        <>
            <Head title="Booking" />

            <PageContainer>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Booking</h1>
                    {allowCreate && (
                        <Button onClick={openCreate}>
                            <CalendarPlus className="mr-2 size-4" />
                            Ajukan Booking
                        </Button>
                    )}
                </div>

                <BookingDataTable
                    data={paginatedData}
                    search={search}
                    perPage={Number(perPage)}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    status={status}
                    onChange={navigate}
                    onSort={handleSort}
                />

                <BookingForm
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeDialog();
                        }
                    }}
                    rooms={rooms}
                    people={people}
                    osh_levels={osh_levels}
                />
            </PageContainer>
        </>
    );
}

BookingsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Booking',
            href: bookings.index(),
        },
    ],
};
