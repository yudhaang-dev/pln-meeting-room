import { Head, useForm } from '@inertiajs/react';
import { PageContainer } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
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
        cancellation_hours: 2,
        auto_approve_bookings: false,
        default_osh_level_id: null,
        display_refresh_interval: 30,
        media_loop_duration: 10,
    };

    const { data, setData, put, processing } = useForm({
        booking_advance_hours: get('booking_advance_hours') as number,
        booking_max_days_ahead: get('booking_max_days_ahead') as number,
        cancellation_hours: get('cancellation_hours') as number,
        auto_approve_bookings: get('auto_approve_bookings') as boolean,
        default_osh_level_id: get('default_osh_level_id') as number | null,
        display_refresh_interval: get('display_refresh_interval') as number,
        media_loop_duration: get('media_loop_duration') as number,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(general.update().url);
    };

    return (
        <>
            <Head title="General Settings" />

            <PageContainer>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Booking Rules</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="booking_advance_hours">
                                    Advance Booking (hours)
                                </Label>
                                <Input
                                    id="booking_advance_hours"
                                    type="number"
                                    min={0}
                                    max={720}
                                    value={data.booking_advance_hours}
                                    onChange={(e) =>
                                        setData(
                                            'booking_advance_hours',
                                            parseInt(e.target.value) || 0,
                                        )
                                    }
                                />
                                <p className="text-muted-foreground text-xs">
                                    How many hours before an event can a user
                                    book
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="booking_max_days_ahead">
                                    Max Days Ahead
                                </Label>
                                <Input
                                    id="booking_max_days_ahead"
                                    type="number"
                                    min={1}
                                    max={365}
                                    value={data.booking_max_days_ahead}
                                    onChange={(e) =>
                                        setData(
                                            'booking_max_days_ahead',
                                            parseInt(e.target.value) || 1,
                                        )
                                    }
                                />
                                <p className="text-muted-foreground text-xs">
                                    Maximum days in the future a user can book
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="cancellation_hours">
                                    Cancellation Window (hours)
                                </Label>
                                <Input
                                    id="cancellation_hours"
                                    type="number"
                                    min={0}
                                    max={168}
                                    value={data.cancellation_hours}
                                    onChange={(e) =>
                                        setData(
                                            'cancellation_hours',
                                            parseInt(e.target.value) || 0,
                                        )
                                    }
                                />
                                <p className="text-muted-foreground text-xs">
                                    Minimum hours before event to allow
                                    cancellation
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Switch
                                    id="auto_approve_bookings"
                                    checked={data.auto_approve_bookings}
                                    onCheckedChange={(checked) =>
                                        setData(
                                            'auto_approve_bookings',
                                            checked,
                                        )
                                    }
                                />
                                <Label htmlFor="auto_approve_bookings">
                                    Auto-approve bookings
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Display</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="display_refresh_interval">
                                    Refresh Interval (seconds)
                                </Label>
                                <Input
                                    id="display_refresh_interval"
                                    type="number"
                                    min={5}
                                    max={300}
                                    value={data.display_refresh_interval}
                                    onChange={(e) =>
                                        setData(
                                            'display_refresh_interval',
                                            parseInt(e.target.value) || 5,
                                        )
                                    }
                                />
                                <p className="text-muted-foreground text-xs">
                                    How often displays auto-refresh
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="media_loop_duration">
                                    Media Loop Duration (seconds)
                                </Label>
                                <Input
                                    id="media_loop_duration"
                                    type="number"
                                    min={3}
                                    max={120}
                                    value={data.media_loop_duration}
                                    onChange={(e) =>
                                        setData(
                                            'media_loop_duration',
                                            parseInt(e.target.value) || 3,
                                        )
                                    }
                                />
                                <p className="text-muted-foreground text-xs">
                                    Seconds each image displays before advancing
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            Save Settings
                        </Button>
                    </div>
                </form>
            </PageContainer>
        </>
    );
}

AdminSettings.layout = {
    breadcrumbs: [
        {
            title: 'Settings',
            href: general.edit(),
        },
    ],
};
