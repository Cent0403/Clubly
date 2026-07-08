interface MetricBarsProps {
  metrics: Array<{ label: string; value: number }>;
  maxValue?: number;
  formatter?: (value: number) => string;
}

const barColor = 'bg-sky-500';

export function MetricBars({ metrics, maxValue = 10, formatter }: MetricBarsProps) {
  return (
    <div className="space-y-3">
      {metrics.map((metric) => {
        const normalizedValue = Math.min(Math.max(metric.value, 0), maxValue);
        const width = `${(normalizedValue / maxValue) * 100}%`;

        return (
          <div key={metric.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{metric.label}</span>
              <span className="text-slate-600 dark:text-slate-300">{formatter ? formatter(metric.value) : metric.value.toFixed(1)}</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800">
              <div className={`h-2.5 rounded-full ${barColor}`} style={{ width }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
