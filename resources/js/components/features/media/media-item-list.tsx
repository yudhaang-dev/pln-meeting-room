import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, Film, GripIcon, ImageIcon, Trash2Icon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export type MediaItem = {
    id: number;
    path: string;
    type: string;
    name: string | null;
    size: number;
    mime: string | null;
    sort_order: number;
    is_active: boolean;
    file_url: string | null;
};

function formatFileSize(bytes: number): string {
    if (bytes === 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 0 : 0)} ${units[i]}`;
}

type ItemProps = {
    item: MediaItem;
    checked?: boolean;
    onToggleActive: (item: MediaItem) => void;
    onRemoveItem?: (item: MediaItem) => void;
    onCheckedChange?: (item: MediaItem, value: boolean) => void;
};

function DragableItem({
    item,
    checked = false,
    onCheckedChange,
    onToggleActive,
    onRemoveItem,
}: ItemProps) {
    // dnd-kit menggunakan ID bertipe string/number untuk tracking posisi
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    // Menyusun style CSS Transform agar pergerakan halus & ukuran tetap stabil
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
    };

    const getIcon = (fileType: string) => {
        switch (fileType) {
            case 'image':
                return <ImageIcon className="size-4" />;
            case 'video':
                return <Film className="size-4" />;
            default:
                return <FileText className="size-4" />;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'w-full divide-y rounded-lg border bg-white shadow-sm transition-shadow duration-200',
                isDragging && 'border-primary/50 opacity-40 shadow-lg',
                !item.is_active && 'opacity-60',
            )}
        >
            <div className="flex flex-row justify-between p-2">
                <div className="flex flex-row items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center">
                        <Checkbox
                            className="cursor-pointer"
                            value={String(item.id)}
                            checked={checked}
                            onCheckedChange={(value) =>
                                onCheckedChange?.(item, value)
                            }
                        />
                    </div>
                    <div className="flex h-8 w-auto items-center justify-center">
                        <Switch
                            className="cursor-pointer"
                            checked={item.is_active}
                            onCheckedChange={() => onToggleActive(item)}
                        />
                    </div>
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => onRemoveItem?.(item)}
                    >
                        <Trash2Icon />
                    </Button>
                </div>
                <div className="flex w-auto gap-2">
                    <div className="text-muted-foreground flex h-8 w-auto items-center justify-center text-center text-sm font-bold">
                        #{item.sort_order}
                    </div>
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        className="cursor-grab"
                        {...attributes}
                        {...listeners}
                    >
                        <GripIcon />
                    </Button>
                </div>
            </div>
            <div className="flex flex-row gap-2 p-2">
                <div className="w-1/4">
                    <AspectRatio ratio={1} className="w-full">
                        {item.type === 'image' && item.file_url ? (
                            <img
                                src={item.file_url}
                                alt={item.name ?? item.path}
                                className="size-full rounded-lg object-contain"
                            />
                        ) : (
                            <div className="text-muted-foreground flex size-full items-center justify-center rounded-lg">
                                {getIcon(item.type)}
                            </div>
                        )}
                    </AspectRatio>
                </div>
                <div className="w-3/4">
                    <div className="text-sm font-normal">{item.name}</div>
                    <div className="text-muted-foreground space-x-2 text-xs">
                        <span>{item.type}</span>
                        {item.size > 0 && (
                            <span>{formatFileSize(item.size)}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

type MediaItemListProps = {
    items: MediaItem[];
    onRemoveItem?: (item: MediaItem) => void;
    onToggleActive: (item: MediaItem) => void;
    onMoveItem?: (dragIndex: number, hoverIndex: number) => void;
    onMoveEnd?: () => void;
    onBulkDelete?: (ids: number[]) => void;
} & ComponentProps<'div'>;

export function MediaItemList({
    className,
    items,
    onToggleActive,
    onMoveItem,
    onMoveEnd,
    onRemoveItem,
    onBulkDelete,
}: MediaItemListProps) {
    // Konfigurasi sensor input untuk mouse/touch dan keyboard koordinat
    const sensors = useSensors(
        useSensor(PointerSensor, {
            // Aktivasi setelah digeser 5 pixel agar klik tombol switch/hapus tidak sengaja memicu drag
            activationConstraint: { distance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // Handler saat proses drag selesai
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const dragIndex = items.findIndex((item) => item.id === active.id);
            const hoverIndex = items.findIndex((item) => item.id === over.id);

            // Meneruskan indeks asal dan target ke fungsi parent onMoveItem
            onMoveItem?.(dragIndex, hoverIndex);
        }

        // Memicu trigger event akhir (misal: hit API simpan urutan baru)
        onMoveEnd?.();
    };

    const [selected, setSelected] = useState<number[]>([]);

    const handleSelectedChange = (item: MediaItem, isChecked: boolean) => {
        if (isChecked) {
            setSelected([...selected, item.id]);
        } else {
            setSelected(selected.filter((id) => id !== item.id));
        }
    };

    return (
        <Card className={cn('pt-0! gap-2 p-2', className)}>
            <CardHeader className="pb-0! flex min-h-14 items-center gap-4 border-b p-0">
                <CardTitle>Media List</CardTitle>
                <Separator orientation="vertical" />
                <CardDescription>
                    <Label htmlFor="check-all">
                        Select all
                        <Checkbox
                            id="check-all"
                            checked={items.length == selected.length}
                            onCheckedChange={(value) =>
                                setSelected(value ? items.map((i) => i.id) : [])
                            }
                        />
                    </Label>
                </CardDescription>
                <Separator orientation="vertical" />
                {selected.length > 0 && (
                    <CardAction className="flex h-14 items-center gap-2 py-2">
                        <div>
                            <span className="font-bold">{selected.length}</span>{' '}
                            selected to{' '}
                        </div>
                        <Button
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => onBulkDelete?.(selected)}
                        >
                            <Trash2Icon />
                        </Button>
                    </CardAction>
                )}
            </CardHeader>
            <CardContent className="rounded-lg bg-slate-100 p-4">
                {items.length > 0 ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        {/* rectSortingStrategy wajib digunakan agar perhitungan posisi grid kotak 3-kolom akurat */}
                        <SortableContext
                            items={items.map((i) => i.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid gap-4 md:grid-cols-3">
                                {items.map((item) => (
                                    <DragableItem
                                        key={item.id} // ID Unik dari database objek
                                        item={item}
                                        onRemoveItem={onRemoveItem}
                                        onToggleActive={onToggleActive}
                                        checked={selected.includes(item.id)}
                                        onCheckedChange={handleSelectedChange}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                ) : (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <ImageIcon />
                            </EmptyMedia>
                            <EmptyTitle>No data</EmptyTitle>
                            <EmptyDescription>
                                No media uploaded
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}
            </CardContent>
        </Card>
    );
}
