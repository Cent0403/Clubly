import { SummaryCard } from "../types";

interface SummaryCardsSectionProps {
  active: boolean;
  summaryCards: SummaryCard[];
}

export function SummaryCardsSection({
  active,
  summaryCards,
}: SummaryCardsSectionProps) {
  return (
    <section
      className={active ? "grid gap-4 md:grid-cols-2 xl:grid-cols-4" : "hidden"}
    >
      {summaryCards.map((card) => (
        <article key={card.label} className="card">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {card.label}
          </p>
          <p className={`mt-2 text-3xl font-extrabold ${card.accent}`}>
            {typeof card.value === "number"
              ? card.value.toFixed(2)
              : card.value}
          </p>
        </article>
      ))}
    </section>
  );
}
