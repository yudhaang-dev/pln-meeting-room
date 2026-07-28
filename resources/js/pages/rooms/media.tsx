import { MediaManager } from '@/components/features/media/media-manager';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import rooms from '@/routes/rooms';

type MediaItem = {
    id: number;
    path: string;
    type: string;
    name: string | null;
    sort_order: number;
    is_active: boolean;
    file_url: string | null;
};

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
                mediableType="room-groups"
                mediableId={room.id}
                media={room.media}
            />
        </PageContainer>
    );
}

RoomMedia.layout = {
    breadcrumbs: [
        {
            title: 'Rooms',
            href: rooms.index(),
        },
        {
            title: 'Media',
            href: '#',
        },
    ],
};
