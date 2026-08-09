import { AnnualMonthlyBarChart } from '@/components/features/dashboard/annual-monthly-bar-chart';
import { OverallPieChart } from '@/components/features/dashboard/overall-pie-chart';
import { PageContainer } from '@/components/shared/page-container';
import { STATUS_COLORS, statusLabel } from '@/lib/chart';
import { CHART_PALETTE } from '@/lib/chart';
import type { ChartSeries } from '@/lib/chart';
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

type Props = {
    statistics: Statistics;
};

function seriesFromRows(rows: MonthlyChartRow[]): ChartSeries[] {
    const keys = Object.keys(rows[0] ?? {}).filter((key) => key !== 'label');

    return keys.map((key, index) => ({
        key,
        label: key,
        color: CHART_PALETTE[index % CHART_PALETTE.length],
    }));
}

export default function DashboardAdmin({ statistics }: Props) {
    const eventsByStatus = statistics.eventsByStatus.map((item) => ({
        name: statusLabel(item.name),
        value: item.value,
        color: STATUS_COLORS[item.name],
    }));

    return (
        <PageContainer>
            <h1 className="text-2xl font-bold">Dashboard</h1>

            <section aria-label="Statistik" className="space-y-4">
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
            </section>
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
