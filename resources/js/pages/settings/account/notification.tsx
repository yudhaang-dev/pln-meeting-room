import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Heading from '@/components/shared/general/heading';
import { SubmitButton } from '@/components/shared/general/submit-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { playBeep } from '@/lib/notification-audio';
import notification from '@/routes/settings/account/notification';

type Props = {
    audio_url: string | null;
    audio_name: string | null;
    default_audio_url: string | null;
};

export default function AdminNotification({
    audio_url,
    audio_name,
    default_audio_url,
}: Props) {
    const { setData, put, processing, errors } = useForm({
        audio_notification: null as File | null,
        remove_audio: false,
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        setData({
            audio_notification: file ?? null,
            remove_audio: false,
        });
        setPreviewUrl(file ? URL.createObjectURL(file) : null);
    };

    const handleUseDefault = () => {
        router.put(notification.update().url, { remove_audio: true });
    };

    const handleTestSound = () => {
        if (previewUrl) {
            const audio = new Audio(previewUrl);
            void audio.play().catch(() => {});

            return;
        }

        playBeep();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(notification.update().url);
    };

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    return (
        <>
            <Head title="Pengaturan notifikasi" />

            <h1 className="sr-only">Pengaturan notifikasi</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Notifikasi"
                    description="Atur audio yang dipakai untuk notifikasi Anda"
                />

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardContent>
                            <FieldGroup>
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

                                    {previewUrl ? (
                                        <audio controls src={previewUrl} />
                                    ) : audio_url ? (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-muted-foreground text-sm">
                                                    {audio_name}
                                                </span>
                                                <audio
                                                    controls
                                                    src={audio_url}
                                                />
                                            </div>
                                            <div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleUseDefault}
                                                >
                                                    Gunakan audio bawaan
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        default_audio_url && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-muted-foreground text-sm">
                                                    Audio bawaan sistem
                                                </span>
                                                <audio
                                                    controls
                                                    src={default_audio_url}
                                                />
                                            </div>
                                        )
                                    )}

                                    <FieldDescription>
                                        Audio yang digunakan untuk notifikasi
                                        Anda. Kosongkan untuk menggunakan audio
                                        bawaan.
                                    </FieldDescription>

                                    {errors.audio_notification && (
                                        <FieldError>
                                            {errors.audio_notification}
                                        </FieldError>
                                    )}
                                </Field>
                            </FieldGroup>
                        </CardContent>
                        <CardFooter className="justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleTestSound}
                            >
                                Tes Suara
                            </Button>
                            <SubmitButton processing={processing} />
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </>
    );
}

AdminNotification.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan notifikasi',
            href: notification.edit(),
        },
    ],
};
