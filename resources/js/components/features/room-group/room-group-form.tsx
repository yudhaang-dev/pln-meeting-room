import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { FormSelection } from '@/components/shared/general/form-selection';
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
import roomGroupRoutes from '@/routes/room-groups';

type Building = { id: number; name: string };
type Room = { id: number; name: string };

type RoomGroupData = {
    id: number;
    building_id: number;
    name: string;
    is_active: boolean;
    rooms: { id: number; name: string }[];
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    group?: RoomGroupData | null;
    buildings: Building[];
    rooms: Room[];
    onSuccess?: () => void;
};

const emptyForm = {
    building_id: '',
    name: '',
    is_active: true,
    room_ids: [] as string[],
};

export function RoomGroupForm({
    open,
    onOpenChange,
    group,
    buildings,
    rooms,
    onSuccess,
}: Props) {
    const isEditing = !!group;

    const { data, setData, post, put, processing, reset, errors } =
        useForm(emptyForm);

    useEffect(() => {
        if (group) {
            setData({
                building_id: String(group.building_id),
                name: group.name,
                is_active: group.is_active,
                room_ids: group.rooms.map((r) => String(r.id)),
            });
        } else {
            reset();
        }
    }, [group, reset, setData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const onSuccessCallback = () => {
            reset();
            onOpenChange(false);
            onSuccess?.();
        };

        if (isEditing && group) {
            put(roomGroupRoutes.update(group.id).url, {
                onSuccess: onSuccessCallback,
            });
        } else {
            post(roomGroupRoutes.store().url, {
                onSuccess: onSuccessCallback,
            });
        }
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Room Group' : 'Create Room Group'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the room group details below.'
                            : 'Fill in the details to create a new room group.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4">
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
                        {errors.building_id && (
                            <p className="text-destructive text-sm">
                                {errors.building_id}
                            </p>
                        )}
                    </div>
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
                        <Label>Rooms</Label>
                        {rooms.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No rooms available.
                            </p>
                        ) : (
                            <FormSelection
                                items={rooms}
                                value={rooms.filter((r) =>
                                    data.room_ids.includes(String(r.id)),
                                )}
                                onChange={(selected) =>
                                    setData(
                                        'room_ids',
                                        selected.map((r) => String(r.id)),
                                    )
                                }
                                getItemValue={(room) => room.id}
                                render={(room) => <span>{room.name}</span>}
                                placeholder="No selected rooms."
                                emptyText="No rooms found."
                                searchPlaceholder="Search rooms..."
                                filterFn={(room, search) =>
                                    room.name
                                        .toLowerCase()
                                        .includes(search.toLowerCase())
                                }
                            />
                        )}
                        {errors.room_ids && (
                            <p className="text-destructive text-sm">
                                {errors.room_ids}
                            </p>
                        )}
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
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            {isEditing ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
