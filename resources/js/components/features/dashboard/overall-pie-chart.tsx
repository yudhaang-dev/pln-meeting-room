import { Cell, Pie, PieChart } from 'recharts';
import { ChartCard } from '@/components/features/dashboard/chart-card';
import { chartTooltipFormatter } from '@/components/features/dashboard/chart-tooltip-content';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { CHART_PALETTE } from '@/lib/chart';

type PieDatum = {
    name: string;
    value: number;
    color?: string;
};

type OverallPieChartProps = {
    title: string;
    description?: string;
    data: PieDatum[];
    className?: string;
};

export function OverallPieChart({
    title,
    description,
    data,
    className,
}: OverallPieChartProps) {
    const config: ChartConfig = Object.fromEntries(
        data.map((item, index) => [
            item.name,
            {
                label: item.name,
                color:
                    item.color ?? CHART_PALETTE[index % CHART_PALETTE.length],
            },
        ]),
    );

    return (
        <ChartCard
            title={title}
            description={description}
            className={className}
        >
            <ChartContainer config={config} className="aspect-auto h-[260px]">
                <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                nameKey="name"
                                hideLabel
                                formatter={chartTooltipFormatter()}
                            />
                        }
                    />
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={2}
                    >
                        {data.map((item, index) => (
                            <Cell
                                key={item.name}
                                fill={
                                    item.color ??
                                    CHART_PALETTE[index % CHART_PALETTE.length]
                                }
                            />
                        ))}
                    </Pie>
                    <ChartLegend
                        content={<ChartLegendContent nameKey="name" />}
                    />
                </PieChart>
            </ChartContainer>
        </ChartCard>
    );
}
