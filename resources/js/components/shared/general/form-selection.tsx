import { CommandGroup, CommandItem, CommandList } from 'cmdk';
import { XCircleIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';

type Props<TData, TValue extends PropertyKey> = {
    items: TData[];
    value: TData[];
    onChange: (items: TData[]) => void;
    getItemValue: (item: TData) => TValue;
    render: (item: TData) => ReactNode;
    placeholder?: string;
    emptyText?: string;
    searchPlaceholder?: string;
    filterFn?: (item: TData, search: string) => boolean;
};

export function FormSelection<TData, TValue extends PropertyKey>({
    items,
    value,
    onChange,
    getItemValue,
    render,
    placeholder = 'No selected items.',
    emptyText = 'No items found.',
    searchPlaceholder = 'Search item...',
    filterFn,
}: Props<TData, TValue>) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const debouncedSearch = useDebounce(search, 300);

    const matches = useMemo(() => {
        const q = debouncedSearch.trim().toLowerCase();

        if (!q) {
            return items;
        }

        const filter =
            filterFn ??
            ((item: TData) =>
                String(getItemValue(item)).toLowerCase().includes(q));

        return items.filter((item) => filter(item, q));
    }, [items, debouncedSearch, filterFn, getItemValue]);

    const unselectedItems = useMemo(() => {
        return matches.filter((item) => {
            const itemValue = getItemValue(item);

            return !value.some(
                (selected) => getItemValue(selected) === itemValue,
            );
        });
    }, [matches, value, getItemValue]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
                setSearch('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectItem = (item: TData) => {
        const itemValue = getItemValue(item);

        if (value.some((selected) => getItemValue(selected) === itemValue)) {
            return;
        }

        const next = [...value, item];
        onChange(next);
        const remaining = unselectedItems.filter(
            (i) => getItemValue(i) !== itemValue,
        );

        if (remaining.length === 0) {
            setOpen(false);
            setSearch('');
        } else {
            inputRef.current?.focus();
        }
    };

    const handleRemoveItem = (item: TData) => {
        const itemValue = getItemValue(item);
        onChange(
            value.filter((selected) => getItemValue(selected) !== itemValue),
        );
    };

    return (
        <div ref={containerRef} className="rounded-lg border">
            <div className="relative p-0.5">
                <Input
                    ref={inputRef}
                    className="border-0 focus-visible:ring-0"
                    value={search}
                    placeholder={searchPlaceholder}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setOpen(true);
                    }}
                    onClick={() => setOpen(true)}
                />
                {open && (
                    <div className="bg-popover absolute inset-x-0 top-full z-50 mt-1 rounded-md border shadow-md">
                        <Command shouldFilter={false} className="p-0">
                            <CommandGroup>
                                {unselectedItems.length > 0 ? (
                                    <CommandList className="max-h-60 p-2">
                                        {unselectedItems.map((item) => (
                                            <CommandItem
                                                className="cursor-pointer"
                                                key={String(getItemValue(item))}
                                                value={String(
                                                    getItemValue(item),
                                                )}
                                                onSelect={() =>
                                                    handleSelectItem(item)
                                                }
                                            >
                                                {render(item)}
                                            </CommandItem>
                                        ))}
                                    </CommandList>
                                ) : (
                                    <CommandEmpty>{emptyText}</CommandEmpty>
                                )}
                            </CommandGroup>
                        </Command>
                    </div>
                )}
            </div>
            <div className="flex min-h-16 flex-col gap-2 border-t p-2">
                {value.map((item) => (
                    <div
                        key={String(getItemValue(item))}
                        className="bg-secondary flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                        <div className="flex-1">{render(item)}</div>
                        <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => handleRemoveItem(item)}
                        >
                            <XCircleIcon className="size-4" />
                        </Button>
                    </div>
                ))}
                {value.length === 0 && (
                    <div className="text-muted-foreground py-3 text-center text-sm">
                        {placeholder}
                    </div>
                )}
            </div>
        </div>
    );
}
