import { Pencil, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
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
import { formatDate } from '@/lib/utils';
import type { PaginatedData } from '@/lib/utils';

export type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
};

type Props = {
    data: PaginatedData<User>;
    search: string;
    perPage: number;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    deleteId: number | null;
    onSearch: (search: string) => void;
    onPerPage: (perPage: number) => void;
    onSort: (column: string) => void;
    onPageChange: (page: number) => void;
    onEdit: (user: User) => void;
    onDeleteRequest: (id: number | null) => void;
    onDeleteConfirm: () => void;
};

export function UserDataTable({
    data,
    deleteId,
    onEdit,
    onDeleteRequest,
    onDeleteConfirm,
}: Props) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Peran</TableHead>
                        <TableHead>Dibuat</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">
                                Tidak ada pengguna.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.data.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    {user.name}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <StatusBadge
                                        label={user.role}
                                        variant="role"
                                    />
                                </TableCell>
                                <TableCell>
                                    {formatDate(user.created_at)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(user)}
                                        >
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Dialog
                                            open={deleteId === user.id}
                                            onOpenChange={(open) =>
                                                open
                                                    ? onDeleteRequest(user.id)
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
                                                        Hapus Pengguna
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Apakah Anda yakin ingin
                                                        menghapus{' '}
                                                        <strong>
                                                            {user.name}
                                                        </strong>
                                                        ? Tindakan ini tidak
                                                        dapat dibatalkan.
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
                                                        Batal
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={
                                                            onDeleteConfirm
                                                        }
                                                    >
                                                        Hapus
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
    );
}
