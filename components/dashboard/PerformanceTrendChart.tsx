import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface PerformanceTrendChartProps {
    data: number[]; // Array of scores (e.g., 0-100)
    label?: string;
    trendValue?: number; // e.g., +12.5
}

const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({ data, label = "Strategic Efficiency", trendValue }) => {
    // Format data for Recharts
    const chartData = data.map((val, idx) => ({
        index: idx + 1,
        value: val
    }));

    const lastValue = data.length > 0 ? data[data.length - 1] : 0;
    const isPositive = (trendValue || 0) >= 0;

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-white font-bold text-lg">Performance Trends</h3>
                    <p className="text-gray-500 text-xs">{label} (Last {data.length} Games)</p>
                </div>
                <div className="flex gap-2">
                    <span className="text-xs text-gray-500 material-icons-outlined cursor-pointer hover:text-white">more_horiz</span>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[160px] relative">
                {/* Overlay Score for the last point */}
                <div className="absolute top-0 right-0 z-10 bg-black/80 border border-primary/30 text-primary font-bold px-2 py-1 rounded text-xs shadow-[0_0_10px_rgba(210,249,111,0.2)]">
                    {lastValue}%
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{
                            top: 10,
                            right: 10,
                            left: -20,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D2F96F" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#D2F96F" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="index" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1E201B', borderColor: '#333', color: '#fff' }}
                            itemStyle={{ color: '#D2F96F' }}
                            labelStyle={{ display: 'none' }}
                            formatter={(value: number) => [`${value}%`, 'Efficiency']}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#D2F96F"
                            strokeWidth={3}
                            fill="url(#colorValue)"
                            dot={{ stroke: '#D2F96F', strokeWidth: 2, r: 4, fill: '#0E100A' }}
                            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-end mt-2">
                <span className="text-xs text-gray-500 font-mono">Current Form</span>
                <span className={`text-sm font-bold flex items-center gap-1 ${isPositive ? 'text-primary' : 'text-red-400'}`}>
                    <span className="material-icons text-sm">{isPositive ? 'trending_up' : 'trending_down'}</span>
                    {trendValue && trendValue > 0 ? '+' : ''}{trendValue}%
                </span>
            </div>
        </div>
    );
};

export default PerformanceTrendChart;
