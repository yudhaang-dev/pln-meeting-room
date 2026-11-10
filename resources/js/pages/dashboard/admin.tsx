import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { router } from '@inertiajs/react';
import {
    Check,
    Eye,
    EyeOff,
    GripVertical,
    LayoutDashboard,
    RotateCcw,
    X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { AnnualMonthlyBarChart } from '@/components/features/dashboard/annual-monthly-bar-chart';
import { OverallPieChart } from '@/components/features/dashboard/overall-pie-chart';
import { RoomStatusGrid } from '@/components/features/dashboard/room-status-grid';
import type { RoomStatus } from '@/components/features/dashboard/room-status-grid';
import { PageContainer } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { useRoomStatusRefresh } from '@/hooks/use-room-status-refresh';
import { STATUS_COLORS, statusLabel } from '@/lib/chart';
import { CHART_PALETTE } from '@/lib/chart';
import type { ChartSeries } from '@/lib/chart';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

type MonthlyChartRow = { label: string } & Record<string, number>;

type RankingChartRow = { name: string; value: number };

type Statistics = {
    eventsMonthly: MonthlyChartRow[];
    participantsMonthly: MonthlyChartRow[];
    eventsByStatus: RankingChartRow[];
    participantsByRoom: RankingChartRow[];
    usersMonthly: MonthlyChartRow[];
    usersShare: RankingChartRow[];
    roomsMonthly: MonthlyChartRow[];
    roomsShare: RankingChartRow[];
};

type Layout = { order: string[]; hidden: string[]; customized: boolean };

type Props = {
    statistics: Statistics;
    roomStatuses: RoomStatus[];
    layout: Layout;
};

const WIDGET_TITLES: Record<string, string> = {
    rooms: 'Status Ruangan Saat Ini',
    events: 'Acara',
    participants: 'Peserta',
    users: 'User Paling Aktif',
    room_usage: 'Ruangan Paling Dipakai',
};

function seriesFromRows(rows: MonthlyChartRow[]): ChartSeries[] {
    const keys = Object.keys(rows[0] ?? {}).filter((key) => key !== 'label');

    return keys.map((key, index) => ({
        key,
        label: key,
        color: CHART_PALETTE[index % CHART_PALETTE.length],
    }));
}

/** Satu blok dalam mode edit: pegangan geser, judul, dan ikon tampil/sembunyi. */
function EditableWidget({
    id,
    hidden,
    onToggle,
    children,
}: {
    id: string;
    hidden: boolean;
    onToggle: () => void;
    children: ReactNode;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            className={cn(
                'rounded-xl border-2 border-dashed p-2',
                isDragging && 'bg-background relative z-10 shadow-lg',
                hidden && 'opacity-60',
            )}
        >
            <div className="flex items-center gap-2 px-1 pb-2">
                <button
                    type="button"
                    ref={setActivatorNodeRef}
                    {...attributes}
                    {...listeners}
                    aria-label={`Geser ${WIDGET_TITLES[id]}`}
                    className="text-muted-foreground hover:bg-accent cursor-grab touch-none rounded p-1 active:cursor-grabbing"
                >
                    <GripVertical className="size-5" />
                </button>
                <span className="flex-1 text-sm font-semibold">
                    {WIDGET_TITLES[id]}
                    {hidden && (
                        <span className="text-muted-foreground ml-2 text-xs font-normal">
                            (disembunyikan)
                        </span>
                    )}
                </span>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    aria-label={
                        hidden
                            ? `Tampilkan ${WIDGET_TITLES[id]}`
                            : `Sembunyikan ${WIDGET_TITLES[id]}`
                    }
                >
                    {hidden ? (
                        <>
                            <EyeOff className="size-4" /> Tampilkan
                        </>
                    ) : (
                        <>
                            <Eye className="size-4" /> Sembunyikan
                        </>
                    )}
                </Button>
            </div>
            {/* Isi blok tidak ikut diklik saat mengatur tata letak */}
            {!hidden && (
                <div className="pointer-events-none select-none">
                    {children}
                </div>
            )}
        </div>
    );
}

export default function DashboardAdmin({
    statistics,
    roomStatuses,
    layout,
}: Props) {
    useRoomStatusRefresh();

    const [editing, setEditing] = useState(false);
    const [draftOrder, setDraftOrder] = useState<string[]>(layout.order);
    const [draftHidden, setDraftHidden] = useState<string[]>(layout.hidden);
    const [saving, setSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const eventsByStatus = statistics.eventsByStatus.map((item) => ({
        name: statusLabel(item.name),
        value: item.value,
        color: STATUS_COLORS[item.name],
    }));

    const widgets: Record<string, ReactNode> = {
        rooms: <RoomStatusGrid rooms={roomStatuses} />,
        events: (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <AnnualMonthlyBarChart
                    title="Acara per Bulan"
                    description="12 bulan terakhir"
                    data={statistics.eventsMonthly}
                    className="lg:col-span-4"
                    series={[
                        { key: 'total', label: 'Total' },
                        {
                            key: 'approved',
                            label: 'Disetujui',
                            color: STATUS_COLORS.approved,
                        },
                        {
                            key: 'rejected',
                            label: 'Ditolak',
                            color: STATUS_COLORS.rejected,
                        },
                    ]}
                />
                <OverallPieChart
                    title="Acara per Status"
                    description="Semua waktu"
                    data={eventsByStatus}
                    className="lg:col-span-1"
                />
            </div>
        ),
        participants: (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <AnnualMonthlyBarChart
                    title="Peserta per Bulan"
                    description="12 bulan terakhir, acara disetujui"
                    data={statistics.participantsMonthly}
                    className="lg:col-span-4"
                    series={[
                        {
                            key: 'participants',
                            label: 'Peserta',
                            color: STATUS_COLORS.approved,
                        },
                    ]}
                />
                <OverallPieChart
                    title="Peserta per Ruangan"
                    description="Semua waktu"
                    data={statistics.participantsByRoom}
                    className="lg:col-span-1"
                />
            </div>
        ),
        users: (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <AnnualMonthlyBarChart
                    title="User Paling Aktif"
                    description="Top 3 pengajuan acara disetujui per bulan"
                    data={statistics.usersMonthly}
                    className="lg:col-span-4"
                    series={seriesFromRows(statistics.usersMonthly)}
                />
                <OverallPieChart
                    title="Pangsa Pengajuan User"
                    description="Semua waktu"
                    data={statistics.usersShare}
                    className="lg:col-span-1"
                />
            </div>
        ),
        room_usage: (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <AnnualMonthlyBarChart
                    title="Ruangan Paling Dipakai"
                    description="Top 3 ruangan berdasarkan acara per bulan"
                    data={statistics.roomsMonthly}
                    className="lg:col-span-4"
                    series={seriesFromRows(statistics.roomsMonthly)}
                />
                <OverallPieChart
                    title="Pangsa Pemakaian Ruangan"
                    description="Semua waktu"
                    data={statistics.roomsShare}
                    className="lg:col-span-1"
                />
            </div>
        ),
    };

    const startEditing = () => {
        setDraftOrder(layout.order);
        setDraftHidden(layout.hidden);
        setEditing(true);
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (over && active.id !== over.id) {
            setDraftOrder((current) =>
                arrayMove(
                    current,
                    current.indexOf(String(active.id)),
                    current.indexOf(String(over.id)),
                ),
            );
        }
    };

    const toggleHidden = (id: string) =>
        setDraftHidden((current) =>
            current.includes(id)
                ? current.filter((x) => x !== id)
                : [...current, id],
        );

    const save = () => {
        router.put(
            '/dashboard/layout',
            { order: draftOrder, hidden: draftHidden },
            {
                preserveScroll: true,
                onStart: () => setSaving(true),
                onSuccess: () => setEditing(false),
                onFinish: () => setSaving(false),
            },
        );
    };

    const reset = () => {
        router.delete('/dashboard/layout', {
            preserveScroll: true,
            onStart: () => setSaving(true),
            onSuccess: () => setEditing(false),
            onFinish: () => setSaving(false),
        });
    };

    const visible = layout.order.filter((id) => !layout.hidden.includes(id));

    return (
        <PageContainer>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-2xl font-bold">Dashboard</h1>

                {editing ? (
                    <div className="flex flex-wrap items-center gap-2">
                        {layout.customized && (
                            <Button
                                variant="ghost"
                                onClick={reset}
                                disabled={saving}
                            >
                                <RotateCcw className="size-4" /> Atur Ulang
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => setEditing(false)}
                            disabled={saving}
                        >
                            <X className="size-4" /> Batal
                        </Button>
                        <Button onClick={save} disabled={saving}>
                            <Check className="size-4" /> Simpan
                        </Button>
                    </div>
                ) : (
                    <Button variant="outline" onClick={startEditing}>
                        <LayoutDashboard className="size-4" /> Edit Dashboard
                    </Button>
                )}
            </div>

            {editing ? (
                <>
                    <p className="text-muted-foreground text-sm">
                        Geser untuk mengubah urutan, atau sembunyikan blok yang
                        tidak diperlukan. Pengaturan ini hanya berlaku untuk
                        akun Anda.
                    </p>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={draftOrder}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-4">
                                {draftOrder.map((id) => (
                                    <EditableWidget
                                        key={id}
                                        id={id}
                                        hidden={draftHidden.includes(id)}
                                        onToggle={() => toggleHidden(id)}
                                    >
                                        {widgets[id]}
                                    </EditableWidget>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </>
            ) : visible.length === 0 ? (
                <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
                    Semua blok dashboard disembunyikan. Klik "Edit Dashboard"
                    untuk menampilkannya kembali.
                </p>
            ) : (
                <div className="space-y-4">
                    {visible.map((id) => (
                        <section key={id} aria-label={WIDGET_TITLES[id]}>
                            {widgets[id]}
                        </section>
                    ))}
                </div>
            )}
        </PageContainer>
    );
}

DashboardAdmin.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
