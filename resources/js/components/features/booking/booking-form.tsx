import { useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { AvailabilityPanel } from '@/components/features/booking/availability-panel';
import { SlotPicker } from '@/components/features/booking/slot-picker';
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
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import bookings from '@/routes/bookings';

type Room = { id: number; name: string; capacity: number };
type Person = { id: number; name: string };
type OshLevel = { id: number; name: string };

type BookingData = {
    id: number;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    status: string;
    participants_count: number;
    media?: 'offline' | 'hybrid';
    room_id: number;
    chairperson_id: number | null;
    osh_level_id: number | null;
    attachment_url: string | null;
    qr_attendance_url: string | null;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rooms: Room[];
    people: Person[];
    osh_levels: OshLevel[];
    booking?: BookingData;
    onSuccess?: () => void;
};

const emptyForm = {
    room_id: '',
    chairperson_id: '',
    osh_level_id: '',
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    participants_count: 1,
    media: 'offline' as 'offline' | 'hybrid',
    attachment: null as File | null,
    qr_attendance: null as File | null,
};

const bookingToFormData = (booking: BookingData) => ({
    room_id: String(booking.room_id),
    chairperson_id: booking.chairperson_id
        ? String(booking.chairperson_id)
        : '',
    osh_level_id: booking.osh_level_id ? String(booking.osh_level_id) : '',
    title: booking.title,
    description: booking.description ?? '',
    start_time: booking.start_time.replace(' ', 'T'),
    end_time: booking.end_time.replace(' ', 'T'),
    participants_count: booking.participants_count,
    media: booking.media ?? ('offline' as 'offline' | 'hybrid'),
});

export function BookingForm({
    open,
    onOpenChange,
    rooms,
    people,
    osh_levels,
    booking,
    onSuccess,
}: Props) {
    const isEditing = !!booking;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const qrInputRef = useRef<HTMLInputElement>(null);
    const [hasConflict, setHasConflict] = useState(false);
    const [pickedDate, setPickedDate] = useState(
        booking ? booking.start_time.slice(0, 10) : '',
    );

    const { data, setData, post, put, processing, reset, errors } = useForm({
        ...emptyForm,
        ...(booking ? bookingToFormData(booking) : {}),
    });

    useEffect(() => {
        if (open && booking) {
            setData(bookingToFormData(booking));
            setPickedDate(booking.start_time.slice(0, 10));
        }
    }, [open, booking, setData]);

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();

        const onSuccessCallback = () => {
            reset();
            onOpenChange(false);
            onSuccess?.();
        };

        if (isEditing && booking) {
            put(bookings.update(booking.id).url, {
                onSuccess: onSuccessCallback,
                preserveState: true,
                preserveScroll: true,
            });
        } else {
            post(bookings.store().url, {
                onSuccess: onSuccessCallback,
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const handleClose = () => {
        reset();
        setPickedDate(booking ? booking.start_time.slice(0, 10) : '');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-h-[95vh] max-w-3xl overflow-y-auto md:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Ubah Booking' : 'Ajukan Booking'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Ubah rincian booking di bawah ini.'
                            : 'Isi rincian untuk mengajukan booking baru.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <FieldGroup className="grid md:grid-cols-2">
                        <Field className="md:col-span-2">
                            <FieldLabel htmlFor="title">Judul Acara</FieldLabel>
                            <Input
                                id="title"
                                value={data.title}
                                onChange={(e) =>
                                    setData('title', e.target.value)
                                }
                            />
                            {errors.title && (
                                <FieldError>{errors.title}</FieldError>
                            )}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="chairperson_id">
                                Pimpinan Acara
                            </FieldLabel>
                            <Combobox
                                id="chairperson_id"
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
                                <ComboboxInput
                                    placeholder="Pilih pimpinan"
                                    showClear
                                />
                                <ComboboxContent>
                                    <ComboboxEmpty>
                                        Tidak ada pimpinan.
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
                            {errors.chairperson_id && (
                                <FieldError>{errors.chairperson_id}</FieldError>
                            )}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="room_id">Ruangan</FieldLabel>
                            <Combobox
                                items={rooms}
                                value={
                                    rooms.find(
                                        (r) => String(r.id) === data.room_id,
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
                                <ComboboxInput
                                    placeholder="Pilih ruangan"
                                    showClear
                                />
                                <ComboboxContent>
                                    <ComboboxEmpty>
                                        Tidak ada ruangan.
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
                                <FieldError>{errors.room_id}</FieldError>
                            )}
                        </Field>
                        <div className="md:col-span-2">
                            <SlotPicker
                                roomId={data.room_id}
                                excludeId={booking?.id}
                                start={data.start_time}
                                end={data.end_time}
                                date={pickedDate}
                                onDateChange={setPickedDate}
                                onChange={({ start, end }) => {
                                    setData((prev) => ({
                                        ...prev,
                                        start_time: start,
                                        end_time: end,
                                    }));
                                }}
                                errors={errors}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <AvailabilityPanel
                                start={data.start_time}
                                end={data.end_time}
                                date={pickedDate}
                                roomId={data.room_id}
                                excludeId={booking?.id}
                                onSelectRoom={(id) => setData('room_id', id)}
                                onConflictChange={setHasConflict}
                            />
                        </div>
                        <Field>
                            <FieldLabel htmlFor="participants_count">
                                Jumlah Peserta
                            </FieldLabel>
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
                                <FieldError>
                                    {errors.participants_count}
                                </FieldError>
                            )}
                        </Field>
                        <Field className="relative">
                            <FieldLabel htmlFor="osh_level_id">
                                Level K3
                            </FieldLabel>
                            <Combobox
                                id="osh_level_id"
                                items={osh_levels}
                                value={
                                    osh_levels.find(
                                        (r) =>
                                            String(r.id) === data.osh_level_id,
                                    ) ?? null
                                }
                                onValueChange={(osh_level) =>
                                    setData(
                                        'osh_level_id',
                                        osh_level ? String(osh_level.id) : '',
                                    )
                                }
                                itemToStringValue={(osh_level) =>
                                    String(osh_level.id)
                                }
                                itemToStringLabel={(osh_level) =>
                                    osh_level.name
                                }
                            >
                                <ComboboxInput
                                    placeholder="Pilih level K3"
                                    showClear
                                />
                                <ComboboxContent>
                                    <ComboboxEmpty>
                                        Tidak ada level K3.
                                    </ComboboxEmpty>
                                    <ComboboxList>
                                        {(osh_level) => (
                                            <ComboboxItem
                                                key={osh_level.id}
                                                value={osh_level}
                                            >
                                                {osh_level.name}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                            {errors.osh_level_id && (
                                <FieldError>{errors.osh_level_id}</FieldError>
                            )}
                        </Field>

                        <Field>
                            <FieldLabel>Format Acara</FieldLabel>
                            <div className="flex gap-2">
                                {(
                                    [
                                        ['offline', 'Offline'],
                                        ['hybrid', 'Hybrid (Zoom)'],
                                    ] as const
                                ).map(([value, label]) => (
                                    <Button
                                        key={value}
                                        type="button"
                                        variant={
                                            data.media === value
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() => setData('media', value)}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </div>
                            {errors.media && (
                                <FieldError>{errors.media}</FieldError>
                            )}
                        </Field>

                        <Field className="md:col-span-2">
                            <FieldLabel htmlFor="description">
                                Keterangan
                            </FieldLabel>
                            <Textarea
                                id="description"
                                rows={3}
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                            />
                            {errors.description && (
                                <FieldError>{errors.description}</FieldError>
                            )}
                        </Field>

                        <FieldSeparator className="md:col-span-2" />
                        <Field>
                            <FieldLabel htmlFor="attachment">
                                Lampiran Dokumen Sumber
                            </FieldLabel>
                            <Input
                                id="attachment"
                                type="file"
                                accept=".pdf,image/*"
                                ref={fileInputRef}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];

                                    if (file) {
                                        setData('attachment', file);
                                    }
                                }}
                            />
                            {errors.attachment && (
                                <FieldError>{errors.attachment}</FieldError>
                            )}
                            <a
                                href="https://amskorporat.pln.co.id/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                            >
                                https://amskorporat.pln.co.id/
                            </a>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="qr_attendance">
                                Lampiran QR Attendance
                            </FieldLabel>
                            <Input
                                id="qr_attendance"
                                type="file"
                                accept="image/*"
                                ref={qrInputRef}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];

                                    if (file) {
                                        setData('qr_attendance', file);
                                    }
                                }}
                            />
                            {errors.qr_attendance && (
                                <FieldError>{errors.qr_attendance}</FieldError>
                            )}
                            <a
                                href="https://hadir.plnnusantarapower.co.id/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                            >
                                https://hadir.plnnusantarapower.co.id/
                            </a>
                        </Field>
                        <Field className="md:col-span-2">
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || hasConflict}
                                >
                                    {processing && <Spinner />}
                                    {isEditing ? 'Perbarui' : 'Ajukan'}
                                </Button>
                            </DialogFooter>
                        </Field>
                    </FieldGroup>
                </form>
            </DialogContent>
        </Dialog>
    );
}
