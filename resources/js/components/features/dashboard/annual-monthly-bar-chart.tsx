import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/components/features/dashboard/chart-card';
import { chartTooltipFormatter } from '@/components/features/dashboard/chart-tooltip-content';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { chartConfig, formatNumber } from '@/lib/chart';
import { CHART_PALETTE } from '@/lib/chart';
import type { ChartSeries } from '@/lib/chart';

type AnnualMonthlyBarChartProps = {
    title: string;
    description?: string;
    data: Record<string, string | number>[];
    series: ChartSeries[];
    categoryKey?: string;
    stacked?: boolean;
    valueFormatter?: (value: number) => string;
    className?: string;
};

export function AnnualMonthlyBarChart({
    title,
    description,
    data,
    series,
    categoryKey = 'label',
    stacked = false,
    valueFormatter = formatNumber,
    className,
}: AnnualMonthlyBarChartProps) {
    const config = chartConfig(series);

    const labels = Object.fromEntries(
        series.map((item) => [item.key, item.label]),
    );

    return (
        <ChartCard
            title={title}
            description={description}
            className={className}
        >
            <ChartContainer
                config={config}
                className="aspect-auto h-[260px] w-full"
            >
                <BarChart
                    data={data}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey={categoryKey}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={40}
                        tickFormatter={(value) => valueFormatter(Number(value))}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={
                            <ChartTooltipContent
                                formatter={chartTooltipFormatter({ labels })}
                            />
                        }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    {series.map((item, index) => (
                        <Bar
                            key={item.key}
                            dataKey={item.key}
                            fill={
                                item.color ??
                                CHART_PALETTE[index % CHART_PALETTE.length]
                            }
                            radius={[4, 4, 0, 0]}
                            stackId={stacked ? 'stack' : undefined}
                            maxBarSize={40}
                        />
                    ))}
                </BarChart>
            </ChartContainer>
        </ChartCard>
    );
}
