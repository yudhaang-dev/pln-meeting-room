import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { RoomDataTable } from '@/components/features/room/room-data-table';
import { RoomForm } from '@/components/features/room/room-form';
import { PageContainer } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { useCrudIndex } from '@/hooks/use-crud-index';
import type { PaginatedData } from '@/lib/utils';
import roomRoutes from '@/routes/rooms';

type Building = {
    id: number;
    name: string;
};

type RoomGroup = {
    id: number;
    name: string;
    building: { name: string };
};

type Room = {
    id: number;
    name: string;
    capacity: number;
    is_active: boolean;
    building_id: number | null;
    room_groups: RoomGroup[];
    building: Building;
};

type Props = {
    rooms: PaginatedData<Room>;
    buildings: Building[];
};

export default function RoomsIndex({ rooms, buildings }: Props) {
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
        indexRoute: roomRoutes.index().url,
        defaultSortBy: 'name',
    });

    const handleOpenEdit = (room: Room) => {
        openEdit(room.id);
    };

    return (
        <>
            <Head title="Ruangan" />

            <PageContainer>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Ruangan</h1>
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 size-4" />
                        Tambah Ruangan
                    </Button>
                </div>

                <RoomDataTable
                    data={rooms}
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
                        handleDelete(roomRoutes.destroy(deleteId!).url)
                    }
                />

                <RoomForm
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeDialog();
                        }
                    }}
                    room={
                        editingId
                            ? (rooms.data.find((r) => r.id === editingId) ??
                              null)
                            : null
                    }
                    buildings={buildings}
                    onSuccess={closeDialog}
                />
            </PageContainer>
        </>
    );
}

RoomsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Ruangan',
            href: roomRoutes.index(),
        },
    ],
};
