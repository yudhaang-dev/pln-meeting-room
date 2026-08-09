import { Head } from '@inertiajs/react';
import { MediaManager } from '@/components/features/media/media-manager';
import type { MediaItem } from '@/components/features/media/media-manager';
import { PageContainer } from '@/components/shared/page-container';

type Props = {
    media: MediaItem[];
};

export default function Infografis({ media }: Props) {
    return (
        <PageContainer>
            <Head title="Infografis" />

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Infografis</h1>
            </div>

            <MediaManager mediableType="global" mediableId={0} media={media} />
        </PageContainer>
    );
}

Infografis.layout = {
    breadcrumbs: [
        {
            title: 'Infografis',
            href: '#',
        },
    ],
};
