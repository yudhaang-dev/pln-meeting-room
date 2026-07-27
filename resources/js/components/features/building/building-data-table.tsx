import { Pencil, Trash2 } from 'lucide-react';
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

export type Building = {
    id: number;
    name: string;
    is_active: boolean;
};

type Props = {
    data: PaginatedData<Building>;
    search: string;
    perPage: number;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    deleteId: number | null;
    onSearch: (search: string) => void;
    onPerPage: (perPage: number) => void;
    onSort: (column: string) => void;
    onPageChange: (page: number) => void;
    onEdit: (building: Building) => void;
    onDeleteRequest: (id: number | null) => void;
    onDeleteConfirm: () => void;
};

export function BuildingDataTable({
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
}: Props) {
    return (
        <>
            <SearchBar
                placeholder="Search buildings..."
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
                                colSpan={3}
                                title="No buildings found."
                            />
                        ) : (
                            data.data.map((building) => (
                                <TableRow key={building.id}>
                                    <TableCell className="font-medium">
                                        {building.name}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                building.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {building.is_active
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
                                                    onEdit(building)
                                                }
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Dialog
                                                open={
                                                    deleteId === building.id
                                                }
                                                onOpenChange={(open) =>
                                                    onDeleteRequest(
                                                        open
                                                            ? building.id
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
                                                            Delete Building
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Are you sure you
                                                            want to delete{' '}
                                                            <strong>
                                                                {
                                                                    building.name
                                                                }
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
