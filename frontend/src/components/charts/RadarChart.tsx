interface RadarMetric {
  label: string;
  value: number;
}

interface RadarChartProps {
  metrics: RadarMetric[];
  maxValue?: number;
}

function polarToCartesian(angle: number, radius: number, center: number) {
  const x = center + radius * Math.cos(angle);
  const y = center + radius * Math.sin(angle);
  return { x, y };
}

export function RadarChart({ metrics, maxValue = 10 }: RadarChartProps) {
  const size = 260;
  const center = size / 2;
  const maxRadius = 90;
  const levels = [0.2, 0.4, 0.6, 0.8, 1].map((step) =>
    Number((maxValue * step).toFixed(2)),
  );

  const angleStep = (Math.PI * 2) / metrics.length;

  const points = metrics
    .map((metric, index) => {
      const angle = -Math.PI / 2 + index * angleStep;
      const normalized = Math.min(maxValue, Math.max(0, metric.value));
      const radius = (normalized / maxValue) * maxRadius;
      const { x, y } = polarToCartesian(angle, radius, center);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto h-48 w-48 md:h-72 md:w-72"
    >
      {levels.map((level) => {
        const radius = (level / maxValue) * maxRadius;
        const ringPoints = metrics
          .map((_, index) => {
            const angle = -Math.PI / 2 + index * angleStep;
            const { x, y } = polarToCartesian(angle, radius, center);
            return `${x},${y}`;
          })
          .join(" ");

        return (
          <polygon
            key={level}
            points={ringPoints}
            fill="none"
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
            strokeWidth="1"
          />
        );
      })}

      {metrics.map((metric, index) => {
        const angle = -Math.PI / 2 + index * angleStep;
        const { x, y } = polarToCartesian(angle, maxRadius, center);
        const labelPosition = polarToCartesian(angle, maxRadius + 24, center);

        return (
          <g key={metric.label}>
            <line
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              className="text-slate-300 dark:text-slate-700"
            />
            <text
              x={labelPosition.x}
              y={labelPosition.y}
              textAnchor="middle"
              className="fill-slate-600 text-[11px] font-semibold dark:fill-slate-300"
            >
              {metric.label}
            </text>
          </g>
        );
      })}

      <polygon
        points={points}
        fill="rgba(14, 165, 233, 0.28)"
        stroke="#0ea5e9"
        strokeWidth="2"
      />
    </svg>
  );
}
