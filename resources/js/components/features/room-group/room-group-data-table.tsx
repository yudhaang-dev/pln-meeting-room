import { Image as ImageIcon, Layers, Pencil, Trash2 } from 'lucide-react';
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

type RoomGroup = {
    id: number;
    building_id: number;
    name: string;
    is_active: boolean;
    building: { id: number; name: string };
    rooms: { id: number; name: string }[];
};

type Props = {
    data: PaginatedData<RoomGroup>;
    search: string;
    perPage: number;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    deleteId: number | null;
    onSearch: (search: string) => void;
    onPerPage: (perPage: number) => void;
    onSort: (column: string) => void;
    onPageChange: (page: number) => void;
    onEdit: (group: RoomGroup) => void;
    onDeleteRequest: (id: number | null) => void;
    onDeleteConfirm: () => void;
    onMedia: (groupId: number) => void;
};

export function RoomGroupDataTable({
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
                placeholder="Search room groups..."
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
                                column="building_id"
                                sortBy={sortBy}
                                sortDirection={sortDirection}
                                onSort={onSort}
                            >
                                Building
                            </SortableHeader>
                            <SortableHeader
                                column="is_active"
                                sortBy={sortBy}
                                sortDirection={sortDirection}
                                onSort={onSort}
                            >
                                Status
                            </SortableHeader>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.data.length === 0 ? (
                            <TableEmpty
                                colSpan={4}
                                icon={Layers}
                                title="No room groups found."
                            />
                        ) : (
                            data.data.map((group) => (
                                <TableRow key={group.id}>
                                    <TableCell className="font-medium">
                                        {group.name}
                                    </TableCell>
                                    <TableCell>{group.building.name}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                group.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {group.is_active
                                                ? 'Active'
                                                : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    onMedia(group.id)
                                                }
                                            >
                                                <ImageIcon className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(group)}
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Dialog
                                                open={deleteId === group.id}
                                                onOpenChange={(open) =>
                                                    open
                                                        ? onDeleteRequest(
                                                              group.id,
                                                          )
                                                        : onDeleteRequest(null)
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
                                                            Delete Room Group
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Are you sure you
                                                            want to delete{' '}
                                                            <strong>
                                                                {group.name}
                                                            </strong>
                                                            ? This action cannot
                                                            be undone.
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
