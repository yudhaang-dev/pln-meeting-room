import { Head } from '@inertiajs/react';
import { MediaManager } from '@/components/features/booking/media-manager';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RouteDefinition } from '@/wayfinder';

type MediaItem = {
    id: number;
    path: string;
    type: string;
    name: string | null;
    sort_order: number;
    is_active: boolean;
    file_url: string | null;
};

type Props = {
    name: string;
    mediableType: 'rooms' | 'room-groups';
    mediableId: number;
    media: MediaItem[];
    backHref: string | RouteDefinition<'get'>;
};

export default function MediaPage({
    name,
    mediableType,
    mediableId,
    media,
    backHref,
}: Props) {
    return (
        <>
            <Head title={`Media — ${name}`} />

            <PageContainer>
                <PageHeader title={`Media — ${name}`} backHref={backHref} />

                <Card>
                    <CardHeader>
                        <CardTitle>Manage Media</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MediaManager
                            mediableType={mediableType}
                            mediableId={mediableId}
                            media={media}
                        />
                    </CardContent>
                </Card>
            </PageContainer>
        </>
    );
}
