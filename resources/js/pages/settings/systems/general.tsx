import { Head, useForm } from '@inertiajs/react';
import { SubmitButton } from '@/components/shared/general/submit-button';
import { PageContainer } from '@/components/shared/page-container';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from '@/components/ui/input-group';
import general from '@/routes/settings/systems/general';

type Settings = Record<string, unknown>;

type Props = {
    settings: Settings;
};

export default function AdminSettings({ settings }: Props) {
    const get = (key: string) => settings[key] ?? defaults[key] ?? '';

    const defaults: Record<string, unknown> = {
        booking_advance_hours: 24,
        booking_max_days_ahead: 30,
        display_refresh_interval: 30,
        media_loop_duration: 10,
    };

    const { data, setData, put, processing, errors } = useForm({
        booking_advance_hours: get('booking_advance_hours') as number,
        booking_max_days_ahead: get('booking_max_days_ahead') as number,
        display_refresh_interval: get('display_refresh_interval') as number,
        media_loop_duration: get('media_loop_duration') as number,
        audio_notification: null as File | null,
    });

    const currentAudioUrl = get('audio_url') as string;

    const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        setData('audio_notification', file ?? null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(general.update().url);
    };

    return (
        <>
            <Head title="General Settings" />

            <PageContainer>
                <h1 className="text-2xl font-bold">Pengaturan Sistem</h1>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardContent>
                            <FieldGroup>
                                <Field>
                                    <FieldLabel>
                                        Minimal waktu pengajuan
                                    </FieldLabel>
                                    <InputGroup>
                                        <InputGroupInput
                                            id="booking_advance_hours"
                                            type="number"
                                            value={data.booking_advance_hours}
                                            onChange={(e) =>
                                                setData(
                                                    'booking_advance_hours',
                                                    parseInt(e.target.value) ||
                                                        0,
                                                )
                                            }
                                        />
                                        <InputGroupAddon align="inline-end">
                                            <InputGroupText>Jam</InputGroupText>
                                        </InputGroupAddon>
                                    </InputGroup>
                                    <FieldDescription>
                                        Minimal jam sebelum untuk pengajuan
                                        booking.
                                    </FieldDescription>
                                    {errors.booking_advance_hours && (
                                        <FieldError>
                                            {errors.booking_advance_hours}
                                        </FieldError>
                                    )}
                                </Field>
                                <Field>
                                    <FieldLabel>
                                        Maksimal waktu pengajuan
                                    </FieldLabel>
                                    <InputGroup>
                                        <InputGroupInput
                                            id="booking_max_days_ahead"
                                            type="number"
                                            value={data.booking_max_days_ahead}
                                            onChange={(e) =>
                                                setData(
                                                    'booking_max_days_ahead',
                                                    parseInt(e.target.value) ||
                                                        0,
                                                )
                                            }
                                        />
                                        <InputGroupAddon align="inline-end">
                                            <InputGroupText>
                                                Hari
                                            </InputGroupText>
                                        </InputGroupAddon>
                                    </InputGroup>
                                    <FieldDescription>
                                        Maksimal hari kedepan untuk pengajuan
                                        booking.
                                    </FieldDescription>
                                    {errors.booking_max_days_ahead && (
                                        <FieldError>
                                            {errors.booking_max_days_ahead}
                                        </FieldError>
                                    )}
                                </Field>
                                <Field>
                                    <FieldLabel>
                                        Durasi tampil infografis
                                    </FieldLabel>
                                    <InputGroup>
                                        <InputGroupInput
                                            id="media_loop_duration"
                                            type="number"
                                            min={3}
                                            max={120}
                                            value={data.media_loop_duration}
                                            onChange={(e) =>
                                                setData(
                                                    'media_loop_duration',
                                                    parseInt(e.target.value) ||
                                                        3,
                                                )
                                            }
                                        />
                                        <InputGroupAddon align="inline-end">
                                            <InputGroupText>
                                                Detik
                                            </InputGroupText>
                                        </InputGroupAddon>
                                    </InputGroup>
                                    <FieldDescription>
                                        Durasi tampilnya inforgrafis pada media
                                        player.
                                    </FieldDescription>
                                    {errors.media_loop_duration && (
                                        <FieldError>
                                            {errors.media_loop_duration}
                                        </FieldError>
                                    )}
                                </Field>
                                <Field>
                                    <FieldLabel>Audio Notifikasi</FieldLabel>
                                    <InputGroup>
                                        <InputGroupInput
                                            id="audio_notification"
                                            type="file"
                                            accept="audio/*"
                                            onChange={handleAudioChange}
                                        />
                                    </InputGroup>
                                    <FieldDescription>
                                        Audio yang digunakan pada sistem
                                        notifikasi.
                                    </FieldDescription>
                                    {errors.audio_notification && (
                                        <FieldError>
                                            {errors.audio_notification}
                                        </FieldError>
                                    )}
                                    {currentAudioUrl && (
                                        <audio controls src={currentAudioUrl} />
                                    )}
                                </Field>
                            </FieldGroup>
                        </CardContent>
                        <CardFooter>
                            <SubmitButton processing={processing} />
                        </CardFooter>
                    </Card>
                </form>
            </PageContainer>
        </>
    );
}

AdminSettings.layout = {
    breadcrumbs: [
        {
            title: 'System Settings',
            href: general.edit(),
        },
    ],
};
