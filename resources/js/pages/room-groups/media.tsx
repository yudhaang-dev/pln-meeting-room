import MediaPage from '@/components/features/booking/media-page';
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
        <MediaPage
            name={roomGroup.name}
            mediableType="room-groups"
            mediableId={roomGroup.id}
            media={roomGroup.media}
            backHref={roomGroups.index()}
        />
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
