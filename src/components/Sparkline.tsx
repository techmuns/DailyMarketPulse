import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface Props {
  data: number[];
  color?: string;
  height?: number;
  strokeWidth?: number;
}

export function Sparkline({ data, color = '#3A5A7A', height = 36, strokeWidth = 1.5 }: Props) {
  const series = data.map((v, i) => ({ i, v }));
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={strokeWidth}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
