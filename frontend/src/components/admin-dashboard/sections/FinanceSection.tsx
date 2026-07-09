import { FormEvent, useMemo, useState } from "react";
import {
  FinanceCategory,
  FinanceDebt,
  FinanceDebtPayment,
  FinanceOverview,
  FinanceTransaction,
  FinanceType,
  PlayerItem,
} from "../../../types";

interface FinanceSectionProps {
  active: boolean;
  loadingFinance: boolean;
  editingCategoryId: number | null;
  editingTransactionId: number | null;
  editingDebtId: number | null;
  overview: FinanceOverview | null;
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  debts: FinanceDebt[];
  debtPayments: FinanceDebtPayment[];
  players: PlayerItem[];
  categoryName: string;
  categoryType: FinanceType;
  transactionType: FinanceType;
  transactionCategoryId: string;
  transactionAmount: string;
  transactionDescription: string;
  transactionDate: string;
  debtPlayerId: string;
  debtAmountDue: string;
  debtDescription: string;
  debtDueDate: string;
  debtPaymentAmount: Record<number, string>;
  debtPaymentDate: Record<number, string>;
  onCategoryNameChange: (value: string) => void;
  onCategoryTypeChange: (value: FinanceType) => void;
  onCreateCategory: (event: FormEvent<HTMLFormElement>) => void;
  onEditCategory: (categoryId: number) => void;
  onCancelEditCategory: () => void;
  onTransactionTypeChange: (value: FinanceType) => void;
  onTransactionCategoryIdChange: (value: string) => void;
  onTransactionAmountChange: (value: string) => void;
  onTransactionDescriptionChange: (value: string) => void;
  onTransactionDateChange: (value: string) => void;
  onCreateTransaction: (event: FormEvent<HTMLFormElement>) => void;
  onEditTransaction: (transactionId: number) => void;
  onCancelEditTransaction: () => void;
  onDebtPlayerIdChange: (value: string) => void;
  onDebtAmountDueChange: (value: string) => void;
  onDebtDescriptionChange: (value: string) => void;
  onDebtDueDateChange: (value: string) => void;
  onCreateDebt: (event: FormEvent<HTMLFormElement>) => void;
  onEditDebt: (debtId: number) => void;
  onCancelEditDebt: () => void;
  onDebtPaymentAmountChange: (debtId: number, value: string) => void;
  onDebtPaymentDateChange: (debtId: number, value: string) => void;
  onCreateDebtPayment: (debtId: number) => void;
}

function formatMoney(value: number): string {
  return `$ ${value.toFixed(2)}`;
}

function formatDebtStatus(status: FinanceDebt["status"]): string {
  if (status === "paid") {
    return "Pagada";
  }

  if (status === "partially_paid") {
    return "Parcial";
  }

  return "Pendiente";
}

type TransactionFilterType = "ALL" | FinanceType;
type DebtFilterStatus = "ALL" | FinanceDebt["status"];

export function FinanceSection({
  active,
  loadingFinance,
  editingCategoryId,
  editingTransactionId,
  editingDebtId,
  overview,
  categories,
  transactions,
  debts,
  debtPayments,
  players,
  categoryName,
  categoryType,
  transactionType,
  transactionCategoryId,
  transactionAmount,
  transactionDescription,
  transactionDate,
  debtPlayerId,
  debtAmountDue,
  debtDescription,
  debtDueDate,
  debtPaymentAmount,
  debtPaymentDate,
  onCategoryNameChange,
  onCategoryTypeChange,
  onCreateCategory,
  onEditCategory,
  onCancelEditCategory,
  onTransactionTypeChange,
  onTransactionCategoryIdChange,
  onTransactionAmountChange,
  onTransactionDescriptionChange,
  onTransactionDateChange,
  onCreateTransaction,
  onEditTransaction,
  onCancelEditTransaction,
  onDebtPlayerIdChange,
  onDebtAmountDueChange,
  onDebtDescriptionChange,
  onDebtDueDateChange,
  onCreateDebt,
  onEditDebt,
  onCancelEditDebt,
  onDebtPaymentAmountChange,
  onDebtPaymentDateChange,
  onCreateDebtPayment,
}: FinanceSectionProps) {
  const [transactionFilterTerm, setTransactionFilterTerm] = useState("");
  const [transactionFilterType, setTransactionFilterType] =
    useState<TransactionFilterType>("ALL");
  const [debtFilterTerm, setDebtFilterTerm] = useState("");
  const [debtFilterStatus, setDebtFilterStatus] =
    useState<DebtFilterStatus>("ALL");

  const availableCategories = categories.filter(
    (category) => category.type === transactionType,
  );

  const filteredTransactions = useMemo(() => {
    const search = transactionFilterTerm.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const typeMatches =
        transactionFilterType === "ALL" ||
        transaction.type === transactionFilterType;

      if (!typeMatches) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        (transaction.description ?? "").toLowerCase().includes(search) ||
        (transaction.category_name ?? "").toLowerCase().includes(search)
      );
    });
  }, [transactionFilterTerm, transactionFilterType, transactions]);

  const filteredDebts = useMemo(() => {
    const search = debtFilterTerm.trim().toLowerCase();

    return debts.filter((debt) => {
      const statusMatches =
        debtFilterStatus === "ALL" || debt.status === debtFilterStatus;

      if (!statusMatches) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        debt.player_name.toLowerCase().includes(search) ||
        (debt.description ?? "").toLowerCase().includes(search)
      );
    });
  }, [debtFilterStatus, debtFilterTerm, debts]);

  return (
    <section className={active ? "space-y-6" : "hidden"}>
      <article className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-xs uppercase tracking-[0.16em] text-sky-500">
            Ingresos
          </p>
          <p className="mt-2 text-2xl font-bold">
            {formatMoney(overview?.totalIncome ?? 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-[0.16em] text-rose-500">
            Gastos
          </p>
          <p className="mt-2 text-2xl font-bold">
            {formatMoney(overview?.totalExpense ?? 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">
            Balance
          </p>
          <p className="mt-2 text-2xl font-bold">
            {formatMoney(overview?.balance ?? 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-[0.16em] text-amber-500">
            Deuda pendiente
          </p>
          <p className="mt-2 text-2xl font-bold">
            {formatMoney(overview?.totalDebtPending ?? 0)}
          </p>
        </div>
      </article>

      <section className="grid gap-6 xl:grid-cols-5">
        <article className="card xl:col-span-2">
          <h3 className="text-xl font-bold">
            {editingCategoryId
              ? `Editar categoría #${editingCategoryId}`
              : "Crear categoría"}
          </h3>
          <form className="mt-4 space-y-3" onSubmit={onCreateCategory}>
            <input
              className="input"
              placeholder="Nombre de categoría"
              value={categoryName}
              onChange={(event) => onCategoryNameChange(event.target.value)}
              required
            />
            <select
              className="input"
              value={categoryType}
              onChange={(event) =>
                onCategoryTypeChange(event.target.value as FinanceType)
              }
            >
              <option value="income">Entrada</option>
              <option value="expense">Salida</option>
            </select>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn-primary"
                type="submit"
                disabled={loadingFinance}
              >
                {loadingFinance
                  ? "Guardando..."
                  : editingCategoryId
                    ? "Actualizar categoría"
                    : "Guardar categoría"}
              </button>
              {editingCategoryId ? (
                <button
                  className="btn-muted"
                  type="button"
                  onClick={onCancelEditCategory}
                >
                  Cancelar edición
                </button>
              ) : null}
            </div>
          </form>

          <h4 className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Categorías existentes
          </h4>
          <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1">
            {categories.map((category) => (
              <div key={category.id} className="card p-2 text-sm">
                <p className="font-semibold">{category.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {category.type === "income" ? "Entrada" : "Salida"}
                </p>
                <div className="mt-2">
                  <button
                    className="btn-muted"
                    type="button"
                    onClick={() => onEditCategory(category.id)}
                  >
                    Editar categoría
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 ? (
              <p className="card p-3 text-sm text-slate-600 dark:text-slate-300">
                Aún no hay categorías registradas.
              </p>
            ) : null}
          </div>
        </article>

        <article className="card xl:col-span-3">
          <h3 className="text-xl font-bold">
            {editingTransactionId
              ? `Editar movimiento #${editingTransactionId}`
              : "Registrar movimiento"}
          </h3>
          <form
            className="mt-4 grid gap-3 md:grid-cols-2"
            onSubmit={onCreateTransaction}
          >
            <select
              className="input"
              value={transactionType}
              onChange={(event) => {
                onTransactionTypeChange(event.target.value as FinanceType);
                onTransactionCategoryIdChange("");
              }}
            >
              <option value="income">Entrada</option>
              <option value="expense">Salida</option>
            </select>

            <select
              className="input"
              value={transactionCategoryId}
              onChange={(event) =>
                onTransactionCategoryIdChange(event.target.value)
              }
            >
              <option value="">Sin categoría</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <input
              className="input"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Monto"
              value={transactionAmount}
              onChange={(event) =>
                onTransactionAmountChange(event.target.value)
              }
              required
            />

            <input
              className="input input-date w-full md:w-auto md:min-w-[10.5rem]"
              type="date"
              value={transactionDate}
              onChange={(event) => onTransactionDateChange(event.target.value)}
              required
            />

            <textarea
              className="input md:col-span-2 min-h-24"
              placeholder="Descripción"
              value={transactionDescription}
              onChange={(event) =>
                onTransactionDescriptionChange(event.target.value)
              }
            />

            <div className="md:col-span-2 flex flex-wrap gap-2">
              <button
                className="btn-primary"
                type="submit"
                disabled={loadingFinance}
              >
                {loadingFinance
                  ? "Guardando..."
                  : editingTransactionId
                    ? "Actualizar movimiento"
                    : "Guardar movimiento"}
              </button>
              {editingTransactionId ? (
                <button
                  className="btn-muted"
                  type="button"
                  onClick={onCancelEditTransaction}
                >
                  Cancelar edición
                </button>
              ) : null}
            </div>
          </form>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <input
              className="input"
              placeholder="Filtrar por descripción/categoría"
              value={transactionFilterTerm}
              onChange={(event) => setTransactionFilterTerm(event.target.value)}
            />
            <select
              className="input"
              value={transactionFilterType}
              onChange={(event) =>
                setTransactionFilterType(
                  event.target.value as TransactionFilterType,
                )
              }
            >
              <option value="ALL">Todos los tipos</option>
              <option value="income">Solo entradas</option>
              <option value="expense">Solo salidas</option>
            </select>
          </div>

          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="card p-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {transaction.description || "Sin descripción"}
                  </p>
                  <p
                    className={
                      transaction.type === "income"
                        ? "font-bold text-emerald-500"
                        : "font-bold text-rose-500"
                    }
                  >
                    {transaction.type === "income" ? "+" : "-"}{" "}
                    {formatMoney(transaction.amount)}
                  </p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {transaction.transaction_date} |{" "}
                  {transaction.category_name ?? "Sin categoría"}
                </p>
                <div className="mt-2">
                  <button
                    className="btn-muted"
                    type="button"
                    onClick={() => onEditTransaction(transaction.id)}
                  >
                    Editar movimiento
                  </button>
                </div>
              </div>
            ))}
            {filteredTransactions.length === 0 ? (
              <p className="card p-3 text-sm text-slate-600 dark:text-slate-300">
                No hay movimientos que coincidan con los filtros.
              </p>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <article className="card xl:col-span-2">
          <h3 className="text-xl font-bold">
            {editingDebtId
              ? `Editar deuda #${editingDebtId}`
              : "Asignar deuda a jugador"}
          </h3>
          <form className="mt-4 space-y-3" onSubmit={onCreateDebt}>
            <select
              className="input"
              value={debtPlayerId}
              onChange={(event) => onDebtPlayerIdChange(event.target.value)}
              required
            >
              <option value="">Selecciona jugador</option>
              {players.map((player) => (
                <option key={player.player_id} value={player.player_id}>
                  {player.full_name}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Monto deuda"
              value={debtAmountDue}
              onChange={(event) => onDebtAmountDueChange(event.target.value)}
              required
            />
            <input
              className="input input-date w-full md:w-auto md:min-w-[10.5rem]"
              type="date"
              value={debtDueDate}
              onChange={(event) => onDebtDueDateChange(event.target.value)}
            />
            <textarea
              className="input min-h-24"
              placeholder="Descripción"
              value={debtDescription}
              onChange={(event) => onDebtDescriptionChange(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <button
                className="btn-primary"
                type="submit"
                disabled={loadingFinance}
              >
                {loadingFinance
                  ? "Guardando..."
                  : editingDebtId
                    ? "Actualizar deuda"
                    : "Guardar deuda"}
              </button>
              {editingDebtId ? (
                <button
                  className="btn-muted"
                  type="button"
                  onClick={onCancelEditDebt}
                >
                  Cancelar edición
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <article className="card xl:col-span-3">
          <h3 className="text-xl font-bold">Estado de deudas</h3>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <input
              className="input"
              placeholder="Filtrar por jugador o descripción"
              value={debtFilterTerm}
              onChange={(event) => setDebtFilterTerm(event.target.value)}
            />
            <select
              className="input"
              value={debtFilterStatus}
              onChange={(event) =>
                setDebtFilterStatus(event.target.value as DebtFilterStatus)
              }
            >
              <option value="ALL">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="partially_paid">Parcial</option>
              <option value="paid">Pagada</option>
            </select>
          </div>

          <div className="mt-3 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
            {filteredDebts.map((debt) => {
              const debtSpecificPayments = debtPayments.filter(
                (payment) => payment.debt_id === debt.id,
              );

              return (
                <div key={debt.id} className="card p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <p className="font-semibold">{debt.player_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDebtStatus(debt.status)}
                    </p>
                  </div>

                  <div className="mt-2 grid gap-2 text-xs text-slate-600 dark:text-slate-300 md:grid-cols-3">
                    <p>
                      Total:{" "}
                      <span className="font-semibold">
                        {formatMoney(debt.amount_due)}
                      </span>
                    </p>
                    <p>
                      Pagado:{" "}
                      <span className="font-semibold">
                        {formatMoney(debt.amount_paid)}
                      </span>
                    </p>
                    <p>
                      Pendiente:{" "}
                      <span className="font-semibold">
                        {formatMoney(debt.amount_pending)}
                      </span>
                    </p>
                  </div>

                  {debt.description ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {debt.description}
                    </p>
                  ) : null}

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input
                      className="input"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Monto pago"
                      value={debtPaymentAmount[debt.id] ?? ""}
                      onChange={(event) =>
                        onDebtPaymentAmountChange(debt.id, event.target.value)
                      }
                    />
                    <input
                      className="input input-date w-full md:w-auto md:min-w-[10.5rem]"
                      type="date"
                      value={debtPaymentDate[debt.id] ?? ""}
                      onChange={(event) =>
                        onDebtPaymentDateChange(debt.id, event.target.value)
                      }
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      className="btn-primary flex-1"
                      type="button"
                      disabled={loadingFinance}
                      onClick={() => onCreateDebtPayment(debt.id)}
                    >
                      Registrar pago
                    </button>
                    <button
                      className="btn-muted flex-1 sm:flex-none"
                      type="button"
                      onClick={() => onEditDebt(debt.id)}
                    >
                      Editar deuda
                    </button>
                  </div>

                  {debtSpecificPayments.length > 0 ? (
                    <div className="mt-3 max-h-24 overflow-y-auto card p-2 text-xs">
                      {debtSpecificPayments.map((payment) => (
                        <p key={payment.id}>
                          {payment.payment_date}:{" "}
                          {formatMoney(payment.amount_paid)}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {filteredDebts.length === 0 ? (
              <p className="card p-3 text-sm text-slate-600 dark:text-slate-300">
                No hay deudas que coincidan con los filtros.
              </p>
            ) : null}
          </div>
        </article>
      </section>
    </section>
  );
}
