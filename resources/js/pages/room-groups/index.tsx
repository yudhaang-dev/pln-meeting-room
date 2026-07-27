import { Head } from '@inertiajs/react';
import { Layers, Plus } from 'lucide-react';
import { RoomGroupDataTable } from '@/components/features/room-group/room-group-data-table';
import { RoomGroupForm } from '@/components/features/room-group/room-group-form';
import { PageContainer } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { useCrudIndex } from '@/hooks/use-crud-index';
import type { PaginatedData } from '@/lib/utils';
import roomGroupRoutes from '@/routes/room-groups';

type Building = {
    id: number;
    name: string;
};

type Room = {
    id: number;
    name: string;
};

type RoomGroup = {
    id: number;
    building_id: number;
    name: string;
    is_active: boolean;
    building: Building;
    rooms: Room[];
};

type Props = {
    roomGroups: PaginatedData<RoomGroup>;
    buildings: Building[];
    rooms: Room[];
};

export default function RoomGroupsIndex({
    roomGroups,
    buildings,
    rooms,
}: Props) {
    const {
        search, sortBy, sortDirection, perPage,
        dialogOpen, editingId, deleteId, setDeleteId,
        navigate, handleSort, handleSearch, handlePerPage,
        openCreate, openEdit, closeDialog, handleDelete,
    } = useCrudIndex({
        indexRoute: roomGroupRoutes.index().url,
        defaultSortBy: 'name',
    });

    const handleOpenEdit = (group: RoomGroup) => {
        openEdit(group.id);
    };

    return (
        <>
            <Head title="Room Groups" />

            <PageContainer>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Room Groups</h1>
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 size-4" />
                        Add Group
                    </Button>
                </div>

                <RoomGroupDataTable
                    data={roomGroups}
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
                    onDeleteConfirm={() => handleDelete(roomGroupRoutes.destroy(deleteId!).url)}
                    onMedia={(groupId) => {
                        window.location.href = roomGroupRoutes.media(groupId).url;
                    }}
                />

                <RoomGroupForm
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        if (!open) closeDialog();
                    }}
                    group={editingId ? roomGroups.data.find((g) => g.id === editingId) ?? null : null}
                    buildings={buildings}
                    rooms={rooms}
                    onSuccess={closeDialog}
                />
            </PageContainer>
        </>
    );
}

RoomGroupsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Room Groups',
            href: roomGroupRoutes.index(),
        },
    ],
};
