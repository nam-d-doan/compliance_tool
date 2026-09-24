import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export interface MiniDonutSlice {
  label: string;
  value: number;
  color: string;
}

interface MiniDonutProps {
  data: MiniDonutSlice[];
  size?: number;
  /** Shown in the center of the ring, e.g. a total count. */
  centerLabel?: string | number;
}

/** Compact, chrome-free donut for embedding inside a summary tile — no
 * legend, no axes, just the ring + an optional center number. */
export function MiniDonut({ data, size = 72, centerLabel }: MiniDonutProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full border-4 border-muted"
        style={{ width: size, height: size }}
      >
        <span className="text-[11px] text-muted-foreground">—</span>
      </div>
    );
  }

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="88%"
            startAngle={90}
            endAngle={-269.999}
            paddingAngle={data.length > 1 ? 2 : 0}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {centerLabel !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold tabular-nums">{centerLabel}</span>
        </div>
      )}
    </div>
  );
}
