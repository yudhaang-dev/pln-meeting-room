import { Link, router, usePage } from '@inertiajs/react';
import { Check, Pencil, SearchIcon, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LengthOptions } from '@/components/shared/data-table/length-options';
import { NavPagination } from '@/components/shared/data-table/nav-pagination';
import { SortableHeader } from '@/components/shared/data-table/sortable-header';
import { OshBadge } from '@/components/shared/osh-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn, formatDate, formatTime } from '@/lib/utils';
import bookings from '@/routes/bookings';
import type { PaginatedData } from '@/types';

type Booking = {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    status: string;
    participants_count: number;
    room: { id: number; name: string };
    requested_by: { id: number; name: string };
    chairperson: { name: string } | null;
    osh_level: { name: string; color: string } | null;
};

type Props = {
    data: PaginatedData<Booking>;
    search: string;
    perPage: number;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    status: string | undefined;
    onChange: (params: {
        page?: number;
        per_page?: number;
        search?: string;
        status?: string;
    }) => void;
    onSort: (column: string) => void;
    className?: string;
};

const DEBOUNCE_MS = 300;

export function BookingDataTable({
    data,
    className,
    search,
    perPage,
    sortBy,
    sortDirection,
    status,
    onChange,
    onSort,
}: Props) {
    const { auth } = usePage().props;

    const isOperator = auth.user.role == 'operator';
    const isAdmin = auth.user.role == 'admin';

    const isAllowAction = isOperator || isAdmin;

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [approveId, setApproveId] = useState<number | null>(null);
    const [rejectId, setRejectId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const [searchInput, setSearchInput] = useState(search);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const statusRef = useRef(status);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    const debouncedSearch = useCallback(
        (value: string) => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            timerRef.current = setTimeout(() => {
                onChange({ search: value, page: 1, status: statusRef.current });
            }, DEBOUNCE_MS);
        },
        [onChange],
    );

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    const { rows, pagination } = useMemo(() => {
        return {
            rows: data.data,
            pagination: {
                current_page: data.current_page,
                last_page: data.last_page,
                total: data.total,
                per_page: data.per_page,
            },
        };
    }, [data]);

    const handlePerPage = useCallback(
        (length: number) => {
            onChange({ per_page: length, page: 1, search, status });
        },
        [onChange, search, status],
    );

    const handlePage = useCallback(
        (page: number) => {
            onChange({ page, search, per_page: perPage, status });
        },
        [onChange, search, perPage, status],
    );

    const handleStatusFilter = useCallback(
        (value: string | undefined) => {
            onChange({ status: value, page: 1, search, per_page: perPage });
        },
        [onChange, search, perPage],
    );

    const handleApprove = useCallback(() => {
        if (!approveId) {
            return;
        }

        setProcessing(true);

        router.post(
            bookings.approve(approveId).url,
            {},
            {
                onFinish: () => {
                    setProcessing(false);
                    setApproveId(null);
                },
                preserveState: true,
            },
        );
    }, [approveId]);

    const handleReject = useCallback(() => {
        if (!rejectId) {
            return;
        }

        if (!rejectReason.trim()) {
            return;
        }

        setProcessing(true);
        router.post(
            bookings.reject(rejectId).url,
            { reason: rejectReason },
            {
                onFinish: () => {
                    setProcessing(false);
                    setRejectId(null);
                    setRejectReason('');
                },
                preserveState: true,
            },
        );
    }, [rejectId, rejectReason]);

    const handleDelete = useCallback(() => {
        if (!deleteId) {
            return;
        }

        setProcessing(true);
        router.delete(bookings.destroy(deleteId).url, {
            onFinish: () => {
                setProcessing(false);
                setDeleteId(null);
            },
        });
    }, [deleteId]);

    return (
        <div className={cn('w-full divide-y overflow-x-auto', className)}>
            <div className="flex w-full flex-wrap items-center justify-between gap-2 p-2">
                <div className="flex items-center gap-2">
                    <LengthOptions current={perPage} onChange={handlePerPage} />
                </div>
                <div className="flex items-center gap-1">
                    {[
                        { label: 'All', value: undefined },
                        { label: 'Pending', value: 'pending' },
                        { label: 'Approved', value: 'approved' },
                        { label: 'Rejected', value: 'rejected' },
                    ].map((item) => (
                        <Button
                            key={item.label}
                            variant={
                                status === item.value ? 'default' : 'ghost'
                            }
                            size="sm"
                            onClick={() => handleStatusFilter(item.value)}
                        >
                            {item.label}
                        </Button>
                    ))}
                </div>
                <div>
                    <div className="relative">
                        <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search bookings..."
                            value={searchInput}
                            onChange={(e) => {
                                const value = e.target.value;
                                setSearchInput(value);
                                debouncedSearch(value);
                            }}
                            className="w-[250px] pl-9"
                        />
                    </div>
                </div>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <SortableHeader
                            column="start_time"
                            sortBy={sortBy}
                            sortDirection={sortDirection}
                            onSort={onSort}
                        >
                            Date & Time
                        </SortableHeader>
                        <TableHead>Title</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Requested By</TableHead>
                        <TableHead>OSH</TableHead>
                        <SortableHeader
                            column="status"
                            sortBy={sortBy}
                            sortDirection={sortDirection}
                            onSort={onSort}
                        >
                            Status
                        </SortableHeader>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                <p className="text-muted-foreground text-sm">
                                    No bookings found.
                                </p>
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="whitespace-nowrap">
                                    <div className="text-sm">
                                        {formatDate(row.start_time)}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        {formatTime(row.start_time)} -{' '}
                                        {formatTime(row.end_time)}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <Link
                                        href={bookings.show(row.id).url}
                                        className="hover:underline"
                                    >
                                        {row.title}
                                    </Link>
                                </TableCell>
                                <TableCell>{row.room.name}</TableCell>
                                <TableCell>{row.requested_by.name}</TableCell>
                                <TableCell>
                                    {row.osh_level ? (
                                        <OshBadge level={row.osh_level} />
                                    ) : (
                                        <span className="text-muted-foreground text-xs">
                                            —
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge label={row.status} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {isAllowAction &&
                                            row.status === 'pending' && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-green-600 hover:text-green-600"
                                                        onClick={() =>
                                                            setApproveId(row.id)
                                                        }
                                                        disabled={processing}
                                                    >
                                                        <Check className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => {
                                                            setRejectId(row.id);
                                                            setRejectReason('');
                                                        }}
                                                        disabled={processing}
                                                    >
                                                        <X className="size-4" />
                                                    </Button>
                                                </>
                                            )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            nativeButton={false}
                                            render={
                                                <a
                                                    href={
                                                        bookings.show(row.id)
                                                            .url
                                                    }
                                                />
                                            }
                                        >
                                            <Pencil className="size-4" />
                                        </Button>
                                        {isAllowAction && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    setDeleteId(row.id)
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            <div className="flex w-full items-center justify-between gap-2 p-2">
                <div>
                    <p className="text-muted-foreground text-sm">
                        Showing {pagination.per_page} of {pagination.total}{' '}
                        results
                    </p>
                </div>
                <div>
                    <NavPagination data={pagination} onChange={handlePage} />
                </div>
            </div>

            <Dialog
                open={deleteId !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Booking</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this booking? This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteId(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={approveId !== null}
                onOpenChange={(open) => !open && setApproveId(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Booking</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve this booking?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setApproveId(null)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleApprove} disabled={processing}>
                            {processing && <Spinner />}
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={rejectId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setRejectId(null);
                        setRejectReason('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Booking</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this booking.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Input
                            placeholder="Enter rejection reason..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejectId(null);
                                setRejectReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={processing || !rejectReason.trim()}
                        >
                            {processing && <Spinner />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
