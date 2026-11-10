import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { UserDataTable } from '@/components/features/user/user-data-table';
import { UserForm } from '@/components/features/user/user-form';
import { PageContainer } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { useCrudIndex } from '@/hooks/use-crud-index';
import type { PaginatedData } from '@/lib/utils';
import userRoutes from '@/routes/users';

type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
};

type Props = {
    users: PaginatedData<User>;
};

export default function UsersIndex({ users }: Props) {
    const {
        search,
        sortBy,
        sortDirection,
        perPage,
        dialogOpen,
        editingId,
        deleteId,
        setDeleteId,
        navigate,
        handleSort,
        handleSearch,
        handlePerPage,
        openCreate,
        openEdit,
        closeDialog,
        handleDelete,
    } = useCrudIndex({
        indexRoute: userRoutes.index().url,
        defaultSortBy: 'created_at',
        defaultSortDirection: 'desc',
    });

    const handleOpenEdit = (user: User) => {
        openEdit(user.id);
    };

    return (
        <>
            <Head title="Pengguna" />

            <PageContainer>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Pengguna</h1>
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 size-4" />
                        Tambah Pengguna
                    </Button>
                </div>

                <UserDataTable
                    data={users}
                    search={search}
                    perPage={Number(perPage)}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    deleteId={deleteId}
                    onSearch={handleSearch}
                    onPerPage={(value) => handlePerPage(String(value))}
                    onSort={handleSort}
                    onPageChange={(page) => navigate({ page })}
                    onEdit={handleOpenEdit}
                    onDeleteRequest={setDeleteId}
                    onDeleteConfirm={() =>
                        handleDelete(userRoutes.destroy(deleteId!).url)
                    }
                />

                <UserForm
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeDialog();
                        }
                    }}
                    user={
                        editingId
                            ? (users.data.find((u) => u.id === editingId) ??
                              null)
                            : null
                    }
                    onSuccess={closeDialog}
                />
            </PageContainer>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Pengguna',
            href: userRoutes.index(),
        },
    ],
};
