import { MediaManager } from '@/components/features/media/media-manager';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import roomGroups from '@/routes/room-groups';

type MediaItem = {
    id: number;
    path: string;
    type: string;
    name: string | null;
    sort_order: number;
    is_active: boolean;
    file_url: string | null;
};

type RoomGroup = {
    id: number;
    name: string;
    media: MediaItem[];
};

type Props = {
    roomGroup: RoomGroup;
};

export default function RoomGroupMedia({ roomGroup }: Props) {
    return (
        <PageContainer>
            <PageHeader
                title={`Media — ${roomGroup.name}`}
                backHref={roomGroups.index()}
            />

            <MediaManager
                mediableType="room-groups"
                mediableId={roomGroup.id}
                media={roomGroup.media}
            />
        </PageContainer>
    );
}

RoomGroupMedia.layout = {
    breadcrumbs: [
        {
            title: 'Room Groups',
            href: roomGroups.index(),
        },
        {
            title: 'Media',
            href: '#',
        },
    ],
};
