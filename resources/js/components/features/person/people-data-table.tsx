import { Camera, Pencil, Trash2 } from 'lucide-react';
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
import { Users } from 'lucide-react';

export type Person = {
    id: number;
    name: string;
    photo: string | null;
    photo_url: string | null;
    is_active: boolean;
};

type Props = {
    data: PaginatedData<Person>;
    search: string;
    perPage: number;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    deleteId: number | null;
    onSearch: (search: string) => void;
    onPerPage: (perPage: number) => void;
    onSort: (column: string) => void;
    onPageChange: (page: number) => void;
    onEdit: (person: Person) => void;
    onDeleteRequest: (id: number | null) => void;
    onDeleteConfirm: () => void;
};

export function PeopleDataTable({
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
    const deletePerson = data.data.find((p) => p.id === deleteId);

    return (
        <>
            <SearchBar
                placeholder="Search people..."
                search={search}
                onSearch={onSearch}
                perPage={String(perPage)}
                onPerPage={(value) => onPerPage(Number(value))}
            />

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12" />
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
                            <TableHead className="text-right" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.data.length === 0 ? (
                            <TableEmpty
                                colSpan={4}
                                icon={Users}
                                title="No people found."
                            />
                        ) : (
                            data.data.map((person) => (
                                <TableRow key={person.id}>
                                    <TableCell>
                                        <div className="bg-muted flex size-8 items-center justify-center overflow-hidden rounded-full border">
                                            {person.photo_url ? (
                                                <img
                                                    src={person.photo_url}
                                                    alt={person.name}
                                                    className="size-full object-cover"
                                                />
                                            ) : (
                                                <Camera className="text-muted-foreground size-4" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {person.name}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                person.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {person.is_active
                                                ? 'Active'
                                                : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(person)}
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Dialog
                                                open={deleteId === person.id}
                                                onOpenChange={(open) =>
                                                    onDeleteRequest(
                                                        open ? person.id : null,
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
                                                            Delete Person
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Are you sure you
                                                            want to delete{' '}
                                                            <strong>
                                                                {person.name}
                                                            </strong>
                                                            ? This action
                                                            cannot be undone.
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
