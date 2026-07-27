import { Pencil, Shield, Trash2 } from 'lucide-react';
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

type OshLevel = {
    id: number;
    name: string;
    color: string;
    min_participants: number;
    max_participants: number;
    sort_order: number;
    is_active: boolean;
};

type Props = {
    data: PaginatedData<OshLevel>;
    search: string;
    perPage: number;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    deleteId: number | null;
    onSearch: (search: string) => void;
    onPerPage: (perPage: number) => void;
    onSort: (column: string) => void;
    onPageChange: (page: number) => void;
    onEdit: (level: OshLevel) => void;
    onDeleteRequest: (id: number | null) => void;
    onDeleteConfirm: () => void;
};

export function OshLevelDataTable({
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
                placeholder="Search OSH levels..."
                search={search}
                onSearch={onSearch}
                perPage={String(perPage)}
                onPerPage={(value) => onPerPage(parseInt(value))}
            />

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10" />
                            <TableHead>Color</TableHead>
                            <SortableHeader
                                column="name"
                                sortBy={sortBy}
                                sortDirection={sortDirection}
                                onSort={onSort}
                            >
                                Name
                            </SortableHeader>
                            <TableHead>Participants Range</TableHead>
                            <SortableHeader
                                column="sort_order"
                                sortBy={sortBy}
                                sortDirection={sortDirection}
                                onSort={onSort}
                            >
                                Order
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
                                colSpan={7}
                                icon={Shield}
                                title="No OSH levels found."
                            />
                        ) : (
                            data.data.map((level) => (
                                <TableRow key={level.id}>
                                    <TableCell className="text-muted-foreground">
                                        <span className="text-xs">
                                            {level.sort_order}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="inline-block size-4 rounded-full border"
                                                style={{
                                                    backgroundColor:
                                                        level.color,
                                                }}
                                            />
                                            <span className="text-muted-foreground font-mono text-xs">
                                                {level.color}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {level.name}
                                    </TableCell>
                                    <TableCell>
                                        {level.min_participants} –{' '}
                                        {level.max_participants.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        {level.sort_order}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                level.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {level.is_active
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
                                                    onEdit(level)
                                                }
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Dialog
                                                open={deleteId === level.id}
                                                onOpenChange={(open) =>
                                                    open
                                                        ? onDeleteRequest(
                                                              level.id,
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
                                                            Delete OSH Level
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Are you sure you
                                                            want to delete{' '}
                                                            <strong>
                                                                {level.name}
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
