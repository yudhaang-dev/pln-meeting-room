import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { twMerge } from 'tailwind-merge';

export type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

export function buildQuery(
    params: Record<string, string | number | undefined>,
): Record<string, string> {
    const query: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') {
            query[key] = String(value);
        }
    }

    return query;
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

function toDate(value: string | Date): Date {
    return typeof value === 'string' ? parseISO(value) : value;
}

export function formatDate(value: string | Date): string {
    return format(toDate(value), 'dd MMMM yyyy', { locale: id });
}

export function formatDayDate(value: string | Date): string {
    return format(toDate(value), 'EEEE, d MMMM yyyy', { locale: id });
}

export function formatTime(value: string | Date): string {
    return format(toDate(value), 'HH:mm');
}

export function formatDateTime(value: string | Date): string {
    return format(toDate(value), 'yyyy-MM-dd HH:mm', { locale: id });
}
