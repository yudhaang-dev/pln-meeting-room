import { Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { DataPagination } from '@/components/shared/data-table/data-pagination';
import { SearchBar } from '@/components/shared/data-table/search-bar';
import { SortableHeader } from '@/components/shared/data-table/sortable-header';
import { TableEmpty } from '@/components/shared/data-table/table-empty';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { PaginatedData } from '@/lib/utils';

type Building = {
    id: number;
    name: string;
};

type RoomGroup = {
    id: number;
    name: string;
    building: { name: string };
};

export type Room = {
    id: number;
    name: string;
    capacity: number;
    is_active: boolean;
    building_id: number | null;
    room_groups: RoomGroup[];
    building: Building;
};

type Props = {
    data: PaginatedData<Room>;
    search: string;
    perPage: number;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    deleteId: number | null;
    onSearch: (search: string) => void;
    onPerPage: (perPage: number) => void;
    onSort: (column: string) => void;
    onPageChange: (page: number) => void;
    onEdit: (room: Room) => void;
    onDeleteRequest: (id: number | null) => void;
    onDeleteConfirm: () => void;
    onMedia: (roomId: number) => void;
};

export function RoomDataTable({
    data,
    search,
    perPage,
    sortBy,
    sortDirection,
    deleteId,
    onSearch,
    onPerPage,
    onSort,
    onPageChange,
    onEdit,
    onDeleteRequest,
    onDeleteConfirm,
    onMedia,
}: Props) {
    return (
        <>
            <SearchBar
                placeholder="Search rooms..."
                search={search}
                onSearch={onSearch}
                perPage={String(perPage)}
                onPerPage={(value) => onPerPage(Number(value))}
            />

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <SortableHeader
                                column="name"
                                sortBy={sortBy}
                                sortDirection={sortDirection}
                                onSort={onSort}
                            >
                                Name
                            </SortableHeader>
                            <SortableHeader
                                column="capacity"
                                sortBy={sortBy}
                                sortDirection={sortDirection}
                                onSort={onSort}
                            >
                                Capacity
                            </SortableHeader>
                            <TableHead>Groups</TableHead>
                            <SortableHeader
                                column="is_active"
                                sortBy={sortBy}
                                sortDirection={sortDirection}
                                onSort={onSort}
                            >
                                Active
                            </SortableHeader>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.data.length === 0 ? (
                            <TableEmpty
                                colSpan={5}
                                title="No rooms found."
                            />
                        ) : (
                            data.data.map((room) => (
                                <TableRow key={room.id}>
                                    <TableCell className="font-medium">
                                        {room.name}
                                    </TableCell>
                                    <TableCell>{room.capacity}</TableCell>
                                    <TableCell>
                                        {room.room_groups.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {room.room_groups.map(
                                                    (g) => (
                                                        <span
                                                            key={g.id}
                                                            className="bg-secondary inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                                                        >
                                                            {g.name}
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                room.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {room.is_active ? 'Yes' : 'No'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                nativeButton={false}
                                                render={
                                                    <a
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            onMedia(room.id);
                                                        }}
                                                    />
                                                }
                                            >
                                                <ImageIcon className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    onEdit(room)
                                                }
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Dialog
                                                open={
                                                    deleteId === room.id
                                                }
                                                onOpenChange={(open) =>
                                                    onDeleteRequest(
                                                        open
                                                            ? room.id
                                                            : null,
                                                    )
                                                }
                                            >
                                                <DialogTrigger
                                                    render={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                        />
                                                    }
                                                >
                                                    <Trash2 className="size-4" />
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>
                                                            Delete Room
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Are you sure you
                                                            want to delete{' '}
                                                            <strong>
                                                                {room.name}
                                                            </strong>
                                                            ? This action
                                                            cannot be
                                                            undone.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <DialogFooter>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() =>
                                                                onDeleteRequest(
                                                                    null,
                                                                )
                                                            }
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            onClick={
                                                                onDeleteConfirm
                                                            }
                                                        >
                                                            Delete
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataPagination data={data} onPageChange={onPageChange} />
        </>
    );
}
