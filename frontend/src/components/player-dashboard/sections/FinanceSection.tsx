import { useMemo, useState } from 'react';
import { FinanceSectionProps } from '../types';

function formatMoney(value: number): string {
  return `$ ${value.toFixed(2)}`;
}

function getDebtStateLabel(status: 'pending' | 'partially_paid' | 'paid'): string {
  if (status === 'paid') {
    return 'Pagada';
  }

  if (status === 'partially_paid') {
    return 'Parcial';
  }

  return 'Pendiente';
}

export function FinanceSection({ active, summary, debts, upcomingDebts, payments }: FinanceSectionProps) {
  const [debtFilterTerm, setDebtFilterTerm] = useState('');
  const [debtFilterStatus, setDebtFilterStatus] = useState<'ALL' | 'pending' | 'partially_paid' | 'paid'>('ALL');
  const [paymentFromDate, setPaymentFromDate] = useState('');
  const [paymentToDate, setPaymentToDate] = useState('');

  const filteredDebts = useMemo(() => {
    const search = debtFilterTerm.trim().toLowerCase();

    return debts.filter((debt) => {
      const statusMatches = debtFilterStatus === 'ALL' || debt.status === debtFilterStatus;

      if (!statusMatches) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (debt.description ?? '').toLowerCase().includes(search);
    });
  }, [debtFilterStatus, debtFilterTerm, debts]);

  const filteredUpcomingDebts = useMemo(() => {
    const search = debtFilterTerm.trim().toLowerCase();

    if (!search) {
      return upcomingDebts;
    }

    return upcomingDebts.filter((debt) => (debt.description ?? '').toLowerCase().includes(search));
  }, [debtFilterTerm, upcomingDebts]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const fromMatches = !paymentFromDate || payment.payment_date >= paymentFromDate;
      const toMatches = !paymentToDate || payment.payment_date <= paymentToDate;

      return fromMatches && toMatches;
    });
  }, [paymentFromDate, paymentToDate, payments]);

  return (
    <section className={active ? 'grid gap-6 xl:grid-cols-5' : 'hidden'}>
      <article className="card xl:col-span-2">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-500">Estado financiero personal</p>
        <h2 className="mt-2 text-2xl font-bold">Deudas y próximos pagos</h2>

        <div className="mt-4 space-y-2 text-sm">
          <p>
            <span className="font-semibold">Total adeudado:</span> {formatMoney(summary?.totalDue ?? 0)}
          </p>
          <p>
            <span className="font-semibold">Total pagado:</span> {formatMoney(summary?.totalPaid ?? 0)}
          </p>
          <p>
            <span className="font-semibold">Pendiente por pagar:</span> {formatMoney(summary?.totalPending ?? 0)}
          </p>
          <p>
            <span className="font-semibold">Deudas activas:</span> {summary?.pendingCount ?? 0}
          </p>
          <p>
            <span className="font-semibold">Pagos futuros:</span> {summary?.upcomingCount ?? 0}
          </p>
          <p>
            <span className="font-semibold">Próximo vencimiento:</span> {summary?.nextDueDate ?? 'Sin fecha'}
          </p>
        </div>
      </article>

      <article className="card xl:col-span-3">
        <h3 className="text-xl font-bold">Próximos vencimientos</h3>
        <div className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1">
          {filteredUpcomingDebts.map((debt) => (
            <div
              key={debt.id}
              className="card p-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{debt.description || 'Deuda registrada'}</p>
                <span className="font-semibold text-amber-500">{debt.due_date ?? 'Sin fecha'}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">Pendiente: {formatMoney(debt.amount_pending)}</p>
            </div>
          ))}
          {filteredUpcomingDebts.length === 0 ? (
            <p className="card p-3 text-sm text-slate-600 dark:text-slate-300">
              No tienes pagos próximos registrados.
            </p>
          ) : null}
        </div>

        <h3 className="mt-5 text-xl font-bold">Mis deudas</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input
            className="input"
            placeholder="Filtrar por descripción"
            value={debtFilterTerm}
            onChange={(event) => setDebtFilterTerm(event.target.value)}
          />
          <select
            className="input"
            value={debtFilterStatus}
            onChange={(event) => setDebtFilterStatus(event.target.value as 'ALL' | 'pending' | 'partially_paid' | 'paid')}
          >
            <option value="ALL">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="partially_paid">Parcial</option>
            <option value="paid">Pagada</option>
          </select>
        </div>
        <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
          {filteredDebts.map((debt) => (
            <div
              key={debt.id}
              className="card p-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{debt.description || 'Deuda registrada'}</p>
                <span className="text-xs text-slate-500 dark:text-slate-400">{getDebtStateLabel(debt.status)}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Total: {formatMoney(debt.amount_due)} | Pagado: {formatMoney(debt.amount_paid)} | Pendiente: {formatMoney(debt.amount_pending)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Vence: {debt.due_date ?? 'Sin fecha'}</p>
            </div>
          ))}
            {filteredDebts.length === 0 ? (
            <p className="card p-3 text-sm text-slate-600 dark:text-slate-300">
              No tienes deudas que coincidan con los filtros.
            </p>
          ) : null}
        </div>

        <h3 className="mt-5 text-xl font-bold">Historial de pagos</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Filtra por rango de fechas</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Desde
            <input
              className="input input-date"
              type="date"
              aria-label="Fecha desde"
              value={paymentFromDate}
              onChange={(event) => setPaymentFromDate(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Hasta
            <input
              className="input input-date"
              type="date"
              aria-label="Fecha hasta"
              value={paymentToDate}
              onChange={(event) => setPaymentToDate(event.target.value)}
            />
          </label>
        </div>
        <div className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="card p-2 text-sm"
            >
              <p className="font-semibold">{formatMoney(payment.amount_paid)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fecha: {payment.payment_date}</p>
            </div>
          ))}
          {filteredPayments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              No hay pagos que coincidan con el rango seleccionado.
            </p>
          ) : null}
        </div>
      </article>
    </section>
  );
}
