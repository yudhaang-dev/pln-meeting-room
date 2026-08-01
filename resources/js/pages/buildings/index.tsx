import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { BuildingDataTable } from '@/components/features/building/building-data-table';
import { BuildingForm } from '@/components/features/building/building-form';
import { PageContainer } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { useCrudIndex } from '@/hooks/use-crud-index';
import type { PaginatedData } from '@/lib/utils';
import buildingRoutes from '@/routes/buildings';

type Building = {
    id: number;
    name: string;
    is_active: boolean;
};

type Props = {
    buildings: PaginatedData<Building>;
};

export default function BuildingsIndex({ buildings }: Props) {
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
        indexRoute: buildingRoutes.index().url,
        defaultSortBy: 'name',
    });

    const handleOpenEdit = (building: Building) => {
        openEdit(building.id);
    };

    return (
        <>
            <Head title="Buildings" />

            <PageContainer>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Buildings</h1>
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 size-4" />
                        Add Building
                    </Button>
                </div>

                <BuildingDataTable
                    data={buildings}
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
                        handleDelete(buildingRoutes.destroy(deleteId!).url)
                    }
                />

                <BuildingForm
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeDialog();
                        }
                    }}
                    building={
                        editingId
                            ? (buildings.data.find((b) => b.id === editingId) ??
                              null)
                            : null
                    }
                    onSuccess={closeDialog}
                />
            </PageContainer>
        </>
    );
}

BuildingsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Buildings',
            href: buildingRoutes.index(),
        },
    ],
};
