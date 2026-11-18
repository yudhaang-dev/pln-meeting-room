import { Head } from '@inertiajs/react';
import {
    CalendarCheck2,
    CalendarClock,
    CalendarDays,
    CalendarX,
    SearchIcon,
    Video,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RoomStatusGrid } from '@/components/features/dashboard/room-status-grid';
import type { RoomStatus } from '@/components/features/dashboard/room-status-grid';
import { useRoomStatusRefresh } from '@/hooks/use-room-status-refresh';
import { LengthOptions } from '@/components/shared/data-table/length-options';
import { NavPagination } from '@/components/shared/data-table/nav-pagination';
import { PageContainer } from '@/components/shared/page-container';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useCrudIndex } from '@/hooks/use-crud-index';
import { cn, formatDate, formatTime } from '@/lib/utils';
import type { PaginatedData } from '@/lib/utils';
import { dashboard } from '@/routes';

type ScheduleBooking = {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    media?: 'offline' | 'hybrid';
    room: { id: number; name: string; building: { id: number; name: string } };
    requested_by: { id: number; name: string };
    chairperson: { name: string };
};

type Props = {
    totalBookings: number;
    pendingBookingsCount: number;
    approvedBookingsCount: number;
    rejectedBookingsCount: number;
    approvedSchedule: PaginatedData<ScheduleBooking>;
    roomStatuses: RoomStatus[];
};

type StatCardProps = {
    label: string;
    value: number;
    icon: ReactNode;
    iconClassName: string;
};

function StatCard({ label, value, icon, iconClassName }: StatCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{label}</CardTitle>
                <CardDescription>
                    <span className="text-foreground text-3xl font-semibold tabular-nums">
                        {value}
                    </span>
                </CardDescription>
                <CardAction>
                    <div
                        className={cn(
                            'flex size-12 items-center justify-center rounded-full',
                            iconClassName,
                        )}
                    >
                        {icon}
                    </div>
                </CardAction>
            </CardHeader>
        </Card>
    );
}

const DEBOUNCE_MS = 300;

export default function UserDashboard({
    totalBookings,
    pendingBookingsCount,
    approvedBookingsCount,
    rejectedBookingsCount,
    approvedSchedule,
    roomStatuses,
}: Props) {
    useRoomStatusRefresh();
    const { search, perPage, navigate } = useCrudIndex({
        indexRoute: dashboard().url,
        defaultSortBy: 'start_time',
        defaultSortDirection: 'asc',
        defaultPerPage: '10',
    });

    const [searchInput, setSearchInput] = useState(search);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchInput = useCallback(
        (value: string) => {
            setSearchInput(value);

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            timerRef.current = setTimeout(() => {
                navigate({ search: value, page: 1 });
            }, DEBOUNCE_MS);
        },
        [navigate],
    );

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    const handlePerPage = useCallback(
        (length: number) => {
            navigate({ per_page: length, page: 1 });
        },
        [navigate],
    );

    const handlePage = useCallback(
        (page: number) => {
            navigate({ page });
        },
        [navigate],
    );

    return (
        <>
            <Head title="Dashboard" />

            <PageContainer>
                <h1 className="text-2xl font-bold">Dashboard</h1>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Total Booking"
                        value={totalBookings}
                        icon={<CalendarDays className="size-5" />}
                        iconClassName="bg-primary/10 text-primary"
                    />
                    <StatCard
                        label="Pending"
                        value={pendingBookingsCount}
                        icon={<CalendarClock className="size-5" />}
                        iconClassName="bg-yellow-100 text-yellow-700"
                    />
                    <StatCard
                        label="Disetujui"
                        value={approvedBookingsCount}
                        icon={<CalendarCheck2 className="size-5" />}
                        iconClassName="bg-green-100 text-green-700"
                    />
                    <StatCard
                        label="Ditolak"
                        value={rejectedBookingsCount}
                        icon={<CalendarX className="size-5" />}
                        iconClassName="bg-red-100 text-red-700"
                    />
                </div>

                <RoomStatusGrid rooms={roomStatuses} />

                <Card className="gap-0 pb-0">
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-base">
                                Jadwal Acara Kedepan
                            </CardTitle>
                            <CardDescription>
                                Agenda & Ruangan yang sedang dan akan
                                berlangsung
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="gap-0 divide-y p-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-2">
                            <LengthOptions
                                current={Number(perPage)}
                                onChange={handlePerPage}
                            />
                            <div className="relative">
                                <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                                <Input
                                    placeholder="Cari agenda atau ruangan..."
                                    value={searchInput}
                                    onChange={(e) =>
                                        handleSearchInput(e.target.value)
                                    }
                                    className="w-full pl-9 md:w-[250px]"
                                />
                            </div>
                        </div>

                        <Table className="mb-0">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Agenda</TableHead>
                                    <TableHead>Ruangan</TableHead>
                                    <TableHead>Pemohon</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {approvedSchedule.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="h-24 text-center"
                                        >
                                            <p className="text-muted-foreground text-sm">
                                                Tidak ada acara mendatang.
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    approvedSchedule.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="text-sm">
                                                    {formatDate(row.start_time)}
                                                </div>
                                                <div className="text-muted-foreground text-xs">
                                                    {formatTime(row.start_time)}{' '}
                                                    - {formatTime(row.end_time)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium">
                                                    {row.title}
                                                    {row.media === 'hybrid' && (
                                                        <Video
                                                            aria-label="Hybrid (Zoom)"
                                                            className="ml-2 inline-block size-4 text-blue-600"
                                                        />
                                                    )}
                                                </div>
                                                <div className="text-muted-foreground text-xs">
                                                    {row.chairperson.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {row.room.name}
                                                </div>
                                                <div className="text-muted-foreground text-xs">
                                                    {row.room.building.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {row.requested_by.name}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                            <p className="text-muted-foreground text-sm">
                                Menampilkan {approvedSchedule.per_page} dari{' '}
                                {approvedSchedule.total} hasil
                            </p>
                            <div>
                                <NavPagination
                                    data={{
                                        current_page:
                                            approvedSchedule.current_page,
                                        last_page: approvedSchedule.last_page,
                                        total: approvedSchedule.total,
                                    }}
                                    onChange={handlePage}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </PageContainer>
        </>
    );
}

UserDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
