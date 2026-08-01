import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { OshLevelDataTable } from '@/components/features/osh-level/osh-level-data-table';
import { OshLevelForm } from '@/components/features/osh-level/osh-level-form';
import { PageContainer } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { useCrudIndex } from '@/hooks/use-crud-index';
import type { PaginatedData } from '@/lib/utils';
import oshLevelRoutes from '@/routes/osh-levels';

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
    oshLevels: PaginatedData<OshLevel>;
};

export default function OshLevelsIndex({ oshLevels }: Props) {
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
        indexRoute: oshLevelRoutes.index().url,
        defaultSortBy: 'sort_order',
    });

    const handleOpenEdit = (level: OshLevel) => {
        openEdit(level.id);
    };

    return (
        <>
            <Head title="OSH Levels" />

            <PageContainer>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">OSH Levels</h1>
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 size-4" />
                        Add Level
                    </Button>
                </div>

                <OshLevelDataTable
                    data={oshLevels}
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
                        handleDelete(oshLevelRoutes.destroy(deleteId!).url)
                    }
                />

                <OshLevelForm
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeDialog();
                        }
                    }}
                    level={
                        editingId
                            ? (oshLevels.data.find((l) => l.id === editingId) ??
                              null)
                            : null
                    }
                    onSuccess={closeDialog}
                />
            </PageContainer>
        </>
    );
}

OshLevelsIndex.layout = {
    breadcrumbs: [
        {
            title: 'OSH Levels',
            href: oshLevelRoutes.index(),
        },
    ],
};
