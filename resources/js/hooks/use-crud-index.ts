import { router } from '@inertiajs/react';
import { useState } from 'react';
import { buildQuery } from '@/lib/utils';
import type { RouteDefinition } from '@/wayfinder';

type UseCrudIndexOptions = {
    indexRoute: string | RouteDefinition<'get'>;
    defaultSortBy?: string;
    defaultSortDirection?: 'asc' | 'desc';
    defaultPerPage?: string;
    initialQuery?: Record<string, string | undefined>;
    extraParams?: Record<string, string | undefined>;
};

export function useCrudIndex({
    indexRoute,
    defaultSortBy = 'name',
    defaultSortDirection = 'asc',
    defaultPerPage = '10',
    initialQuery = {},
    extraParams,
}: UseCrudIndexOptions) {
    const urlParams = new URLSearchParams(window.location.search);
    const [search, setSearch] = useState(
        initialQuery.search ?? urlParams.get('search') ?? '',
    );
    const [sortBy, setSortBy] = useState(
        initialQuery.sort_by ?? urlParams.get('sort_by') ?? defaultSortBy,
    );
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
        ((initialQuery.sort_direction ??
            urlParams.get('sort_direction')) as 'asc' | 'desc') ??
            defaultSortDirection,
    );
    const [perPage, setPerPage] = useState(
        initialQuery.per_page ?? urlParams.get('per_page') ?? defaultPerPage,
    );
    const [page, setPage] = useState(
        initialQuery.page ?? urlParams.get('page') ?? '1',
    );
    const [status, setStatus] = useState<string | undefined>(
        (initialQuery.status ?? urlParams.get('status') ?? undefined) as
            | string
            | undefined,
    );
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const navigate = (
        overrides: Record<string, string | number | undefined> = {},
    ) => {
        const nextSearch = overrides.search !== undefined
            ? String(overrides.search)
            : search;
        const nextSortBy = overrides.sort_by !== undefined
            ? String(overrides.sort_by)
            : sortBy;
        const nextSortDirection = overrides.sort_direction !== undefined
            ? String(overrides.sort_direction)
            : sortDirection;
        const nextPerPage = overrides.per_page !== undefined
            ? String(overrides.per_page)
            : perPage;
        const nextPage = overrides.page !== undefined
            ? String(overrides.page)
            : page;
        const nextStatus = 'status' in overrides
            ? (overrides.status as string | undefined)
            : status;

        setSearch(nextSearch);
        setSortBy(nextSortBy);
        setSortDirection(nextSortDirection as 'asc' | 'desc');
        setPerPage(nextPerPage);
        setPage(nextPage);
        setStatus(nextStatus);

        const query = buildQuery({
            ...extraParams,
            search: nextSearch,
            sort_by: nextSortBy,
            sort_direction: nextSortDirection,
            per_page: nextPerPage,
            page: nextPage,
            status: nextStatus,
        });
        router.get(indexRoute, query, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSort = (column: string) => {
        const newDirection =
            sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortBy(column);
        setSortDirection(newDirection);
        navigate({ sort_by: column, sort_direction: newDirection });
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage('1');
        navigate({ search: value, page: 1 });
    };

    const handlePerPage = (value: string) => {
        setPerPage(value);
        setPage('1');
        navigate({ per_page: value, page: 1 });
    };

    const openCreate = () => {
        setEditingId(null);
        setDialogOpen(true);
    };

    const openEdit = (id: number) => {
        setEditingId(id);
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setEditingId(null);
    };

    const handleDelete = (destroyUrl: string) => {
        if (!deleteId) {
            return;
        }

        router.delete(destroyUrl, {
            onSuccess: () => setDeleteId(null),
        });
    };

    return {
        search,
        sortBy,
        sortDirection,
        perPage,
        page,
        status,
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
    };
}
