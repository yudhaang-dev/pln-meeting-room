import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { PeopleDataTable } from '@/components/features/person/people-data-table';
import { PersonForm } from '@/components/features/person/person-form';
import { PageContainer } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { useCrudIndex } from '@/hooks/use-crud-index';
import type { PaginatedData } from '@/lib/utils';
import personRoutes from '@/routes/people';

type Person = {
    id: number;
    name: string;
    photo: string | null;
    photo_url: string | null;
    is_active: boolean;
};

type Props = {
    people: PaginatedData<Person>;
};

export default function PeopleIndex({ people }: Props) {
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
        indexRoute: personRoutes.index().url,
        defaultSortBy: 'name',
    });

    const handleOpenEdit = (person: Person) => {
        openEdit(person.id);
    };

    return (
        <>
            <Head title="Pimpinan Acara" />

            <PageContainer>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Pimpinan Acara</h1>
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 size-4" />
                        Add Person
                    </Button>
                </div>

                <PeopleDataTable
                    data={people}
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
                        handleDelete(personRoutes.destroy(deleteId!).url)
                    }
                />

                <PersonForm
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeDialog();
                        }
                    }}
                    person={
                        editingId
                            ? (people.data.find((p) => p.id === editingId) ??
                              null)
                            : null
                    }
                    onSuccess={closeDialog}
                />
            </PageContainer>
        </>
    );
}

PeopleIndex.layout = {
    breadcrumbs: [
        {
            title: 'Pimpinan Acara',
            href: personRoutes.index(),
        },
    ],
};
