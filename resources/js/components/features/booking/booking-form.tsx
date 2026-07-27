import { router, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import bookings from '@/routes/bookings';

type Room = { id: number; name: string; capacity: number };
type Person = { id: number; name: string };

type BookingData = {
    id: number;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    status: string;
    participants_count: number;
    room_id: number;
    chairperson_id: number | null;
    attachment_url: string | null;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rooms: Room[];
    people: Person[];
    booking?: BookingData;
    onSuccess?: () => void;
};

const emptyForm = {
    room_id: '',
    chairperson_id: '',
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    participants_count: 1,
    attachment: null as File | null,
};

export function BookingForm({
    open,
    onOpenChange,
    rooms,
    people,
    booking,
    onSuccess,
}: Props) {
    const isEditing = !!booking;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        ...emptyForm,
        ...(booking
            ? {
                  room_id: String(booking.room_id),
                  chairperson_id: booking.chairperson_id
                      ? String(booking.chairperson_id)
                      : '',
                  title: booking.title,
                  description: booking.description ?? '',
                  start_time: booking.start_time,
                  end_time: booking.end_time,
                  participants_count: booking.participants_count,
              }
            : {}),
    });

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();

        const onSuccessCallback = () => {
            reset();
            setFileName(null);
            onOpenChange(false);
            onSuccess?.();
        };

        if (isEditing && booking) {
            router.post(
                bookings.update(booking.id).url,
                {
                    ...data,
                    _method: 'PUT',
                },
                {
                    onSuccess: onSuccessCallback,
                },
            );
        } else {
            post(bookings.store().url, {
                onSuccess: onSuccessCallback,
            });
        }
    };

    const handleClose = () => {
        reset();
        setFileName(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Booking' : 'Book Room'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the booking details below.'
                            : 'Fill in the details to create a new booking.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="room_id">Room *</Label>
                        <Combobox
                            items={rooms}
                            value={
                                rooms.find(
                                    (r) =>
                                        String(r.id) === data.room_id,
                                ) ?? null
                            }
                            onValueChange={(room) =>
                                setData(
                                    'room_id',
                                    room ? String(room.id) : '',
                                )
                            }
                            itemToStringValue={(room) => String(room.id)}
                            itemToStringLabel={(room) => room.name}
                        >
                            <ComboboxInput placeholder="Select room" showClear />
                            <ComboboxContent>
                                <ComboboxEmpty>
                                    No rooms found.
                                </ComboboxEmpty>
                                <ComboboxList>
                                    {(room) => (
                                        <ComboboxItem
                                            key={room.id}
                                            value={room}
                                        >
                                            {room.name} (capacity:{' '}
                                            {room.capacity})
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                        {errors.room_id && (
                            <p className="text-destructive text-sm">
                                {errors.room_id}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                        {errors.title && (
                            <p className="text-destructive text-sm">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-destructive text-sm">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="start_time">Start Time *</Label>
                            <Input
                                id="start_time"
                                type="datetime-local"
                                value={data.start_time}
                                onChange={(e) =>
                                    setData('start_time', e.target.value)
                                }
                            />
                            {errors.start_time && (
                                <p className="text-destructive text-sm">
                                    {errors.start_time}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="end_time">End Time *</Label>
                            <Input
                                id="end_time"
                                type="datetime-local"
                                value={data.end_time}
                                onChange={(e) =>
                                    setData('end_time', e.target.value)
                                }
                            />
                            {errors.end_time && (
                                <p className="text-destructive text-sm">
                                    {errors.end_time}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="participants_count">
                                Participants *
                            </Label>
                            <Input
                                id="participants_count"
                                type="number"
                                min={1}
                                value={data.participants_count}
                                onChange={(e) =>
                                    setData(
                                        'participants_count',
                                        parseInt(e.target.value) || 1,
                                    )
                                }
                            />
                            {errors.participants_count && (
                                <p className="text-destructive text-sm">
                                    {errors.participants_count}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="chairperson_id">Event Leader</Label>
                            <Combobox
                                items={people}
                                value={
                                    people.find(
                                        (p) =>
                                            String(p.id) ===
                                            data.chairperson_id,
                                    ) ?? null
                                }
                                onValueChange={(person) =>
                                    setData(
                                        'chairperson_id',
                                        person ? String(person.id) : '',
                                    )
                                }
                                itemToStringValue={(person) =>
                                    String(person.id)
                                }
                                itemToStringLabel={(person) => person.name}
                            >
                                <ComboboxInput placeholder="Select leader" showClear />
                                <ComboboxContent>
                                    <ComboboxEmpty>
                                        No people found.
                                    </ComboboxEmpty>
                                    <ComboboxList>
                                        {(person) => (
                                            <ComboboxItem
                                                key={person.id}
                                                value={person}
                                            >
                                                {person.name}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </div>
                    </div>

                    {!isEditing && (
                        <div className="grid gap-2">
                            <Label htmlFor="attachment">Attachment *</Label>
                            <Input
                                id="attachment"
                                type="file"
                                accept=".pdf,image/*"
                                ref={fileInputRef}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];

                                    if (file) {
                                        setData('attachment', file);
                                        setFileName(file.name);
                                    }
                                }}
                            />
                            {fileName && (
                                <p className="text-muted-foreground text-xs">
                                    Selected: {fileName}
                                </p>
                            )}
                            {errors.attachment && (
                                <p className="text-destructive text-sm">
                                    {errors.attachment}
                                </p>
                            )}
                        </div>
                    )}

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
