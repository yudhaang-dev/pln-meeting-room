import MediaPage from '@/components/features/booking/media-page';
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
        <MediaPage
            name={room.name}
            mediableType="rooms"
            mediableId={room.id}
            media={room.media}
            backHref={rooms.index()}
        />
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
