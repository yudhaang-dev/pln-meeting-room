# Refactoring TODO

## Shared Types & Utilities

- [ ] Extract `PaginatedData<T>` type ke `resources/js/types/pagination.ts`
- [ ] Extract `buildQuery()` ke `resources/js/lib/query.ts`
- [ ] Extract `formatTime()`, `formatDate()`, `formatDateTimeLong()` ke `resources/js/lib/utils.ts`

## Shared Components

- [ ] `<SortableHeader>` — `resources/js/components/sortable-header.tsx`
- [ ] `<SearchFilterBar>` — `resources/js/components/search-filter-bar.tsx`
- [ ] `<DataPagination>` — `resources/js/components/data-pagination.tsx`
- [ ] `<FormField>` — `resources/js/components/form-field.tsx`
- [ ] `<ConfirmDeleteDialog>` — `resources/js/components/confirm-delete-dialog.tsx`
- [ ] `<StatusBadge>` — `resources/js/components/status-badge.tsx`
- [ ] `<OshBadge>` — `resources/js/components/osh-badge.tsx`
- [ ] `<PageContainer>` — `resources/js/components/page-container.tsx`
- [ ] `<PageHeader>` — `resources/js/components/page-header.tsx`

## Shared Hooks

- [ ] `useCrudIndex()` — `resources/js/hooks/use-crud-index.ts`

## Page Deduplication

- [x] Merge settings pages (user vs admin) — `settings/profile.tsx`, `settings/security.tsx`, `settings/appearance.tsx`
- [x] Merge booking show pages — `bookings/show.tsx` vs `admin/bookings/show.tsx`
- [x] Merge media pages — `admin/rooms/media.tsx` vs `admin/room-groups/media.tsx`
