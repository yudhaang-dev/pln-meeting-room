import { MediaManager } from '@/components/features/media/media-manager';
import type { MediaItem } from '@/components/features/media/media-manager';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import rooms from '@/routes/rooms';

type Room = {
    id: number;
    name: string;
    media: MediaItem[];
};

type Props = {
    room: Room;
};

export default function RoomMedia({ room }: Props) {
    return (
        <PageContainer>
            <PageHeader
                title={`Media — ${room.name}`}
                backHref={rooms.index()}
            />

            <MediaManager
                mediableType="rooms"
                mediableId={room.id}
                media={room.media}
            />
        </PageContainer>
    );
}

RoomMedia.layout = {
    breadcrumbs: [
        {
            title: 'Ruangan',
            href: rooms.index(),
        },
        {
            title: 'Media',
            href: '#',
        },
    ],
};
