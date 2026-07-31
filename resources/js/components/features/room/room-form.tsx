import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import roomRoutes from '@/routes/rooms';
import type { Room } from './room-data-table';

type Building = {
    id: number;
    name: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    room?: Room | null;
    buildings: Building[];
    onSuccess?: () => void;
};

const emptyForm = {
    name: '',
    capacity: 10,
    building_id: '',
    is_active: true,
};

export function RoomForm({
    open,
    onOpenChange,
    room,
    buildings,
    onSuccess,
}: Props) {
    const { data, setData, post, put, processing, reset, errors } =
        useForm(emptyForm);

    useEffect(() => {
        if (room) {
            setData({
                name: room.name,
                capacity: room.capacity,
                building_id: room.building_id ? String(room.building_id) : '',
                is_active: room.is_active,
            });
        } else {
            reset();
        }
    }, [room, reset, setData]);

    const handleOpenChange = (value: boolean) => {
        if (!value) {
            reset();
        }

        onOpenChange(value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const onSuccessCallback = () => {
            handleOpenChange(false);
            onSuccess?.();
        };

        if (room) {
            put(roomRoutes.update(room.id).url, {
                onSuccess: onSuccessCallback,
            });
        } else {
            post(roomRoutes.store().url, {
                onSuccess: onSuccessCallback,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {room ? 'Edit Room' : 'Create Room'}
                    </DialogTitle>
                    <DialogDescription>
                        {room
                            ? 'Update the room details below.'
                            : 'Fill in the details to create a new room.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-destructive text-sm">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                            id="capacity"
                            type="number"
                            min={1}
                            value={data.capacity}
                            onChange={(e) =>
                                setData(
                                    'capacity',
                                    parseInt(e.target.value) || 1,
                                )
                            }
                        />
                        {errors.capacity && (
                            <p className="text-destructive text-sm">
                                {errors.capacity}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="building_id">Building</Label>
                        <Combobox
                            items={buildings}
                            value={
                                buildings.find(
                                    (b) => String(b.id) === data.building_id,
                                ) ?? null
                            }
                            onValueChange={(building) =>
                                setData(
                                    'building_id',
                                    building ? String(building.id) : '',
                                )
                            }
                            itemToStringValue={(building) =>
                                String(building.id)
                            }
                            itemToStringLabel={(building) => building.name}
                        >
                            <ComboboxInput
                                placeholder="Select building"
                                showClear
                            />
                            <ComboboxContent>
                                <ComboboxEmpty>
                                    No buildings found.
                                </ComboboxEmpty>
                                <ComboboxList>
                                    {(building) => (
                                        <ComboboxItem
                                            key={building.id}
                                            value={building}
                                        >
                                            {building.name}
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </div>
                    <div className="flex items-center gap-3 pb-0.5">
                        <Switch
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) =>
                                setData('is_active', checked)
                            }
                        />
                        <Label htmlFor="is_active">Active</Label>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            {room ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
