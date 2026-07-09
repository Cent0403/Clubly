import { Router } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../middleware/auth';

type FinanceType = 'income' | 'expense';

interface FinanceCategoryRow extends RowDataPacket {
  id: number;
  name: string;
  type: FinanceType;
  created_at: string;
}

interface FinanceTransactionRow extends RowDataPacket {
  id: number;
  category_id: number | null;
  category_name: string | null;
  amount: number;
  type: FinanceType;
  description: string | null;
  transaction_date: string;
  created_at: string;
}

interface PlayerDebtRow extends RowDataPacket {
  id: number;
  player_id: number;
  player_name: string;
  amount_due: number;
  amount_paid: number;
  amount_pending: number;
  description: string | null;
  status: 'pending' | 'partially_paid' | 'paid';
  due_date: string | null;
  created_at: string;
}

interface PlayerDebtPaymentRow extends RowDataPacket {
  id: number;
  debt_id: number;
  amount_paid: number;
  payment_date: string;
}

interface PlayerDebtSummaryRow extends RowDataPacket {
  total_due: number;
  total_paid: number;
  total_pending: number;
  debt_count: number;
  pending_count: number;
  upcoming_count: number;
  next_due_date: string | null;
}

interface CreateCategoryBody {
  name?: string;
  type?: FinanceType;
}

interface UpdateCategoryBody {
  name?: string;
  type?: FinanceType;
}

interface CreateTransactionBody {
  categoryId?: number | null;
  amount?: number;
  type?: FinanceType;
  description?: string;
  transactionDate?: string;
}

interface UpdateTransactionBody {
  categoryId?: number | null;
  amount?: number;
  type?: FinanceType;
  description?: string;
  transactionDate?: string;
}

interface CreateDebtBody {
  playerId?: number;
  amountDue?: number;
  description?: string;
  dueDate?: string;
}

interface UpdateDebtBody {
  amountDue?: number;
  description?: string | null;
  dueDate?: string | null;
}

interface CreateDebtPaymentBody {
  amountPaid?: number;
  paymentDate?: string;
}

const financeRouter = Router();

function isFinanceType(value: unknown): value is FinanceType {
  return value === 'income' || value === 'expense';
}

function toDecimal(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Number(parsed.toFixed(2));
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

let financeSchemaReady: Promise<void> | null = null;

async function ensureFinanceSchema(): Promise<void> {
  if (!financeSchemaReady) {
    financeSchemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS finance_categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          type ENUM('income', 'expense') NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS finance_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          category_id INT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          type ENUM('income', 'expense') NOT NULL,
          description TEXT NULL,
          transaction_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_finance_transactions_category
            FOREIGN KEY (category_id) REFERENCES finance_categories(id)
            ON DELETE SET NULL
            ON UPDATE CASCADE,
          INDEX idx_finance_transactions_date (transaction_date),
          INDEX idx_finance_transactions_type (type),
          INDEX idx_finance_transactions_category (category_id)
        ) ENGINE=InnoDB
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS player_debts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          player_id INT UNSIGNED NOT NULL,
          amount_due DECIMAL(10, 2) NOT NULL,
          amount_paid DECIMAL(10, 2) DEFAULT 0.00,
          description VARCHAR(255) NULL,
          status ENUM('pending', 'partially_paid', 'paid') DEFAULT 'pending',
          due_date DATE NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_player_debts_player
            FOREIGN KEY (player_id) REFERENCES players(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
          INDEX idx_player_debts_player (player_id),
          INDEX idx_player_debts_status (status),
          INDEX idx_player_debts_due_date (due_date)
        ) ENGINE=InnoDB
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS player_debt_payments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          debt_id INT NOT NULL,
          amount_paid DECIMAL(10, 2) NOT NULL,
          payment_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_player_debt_payments_debt
            FOREIGN KEY (debt_id) REFERENCES player_debts(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
          INDEX idx_player_debt_payments_debt (debt_id),
          INDEX idx_player_debt_payments_date (payment_date)
        ) ENGINE=InnoDB
      `);
    })().catch((error) => {
      financeSchemaReady = null;
      throw error;
    });
  }

  await financeSchemaReady;
}

financeRouter.use(requireAuth);

financeRouter.get('/my-debts', requireRole('PLAYER'), async (req, res) => {
  await ensureFinanceSchema();

  const playerId = req.user?.playerId;

  if (!playerId) {
    res
      .status(404)
      .json({
        message: 'Perfil de jugador no encontrado para el usuario actual',
      });
    return;
  }

  const [summaryRows] = await pool.query<PlayerDebtSummaryRow[]>(
    `
      SELECT
        COALESCE(SUM(d.amount_due), 0) AS total_due,
        COALESCE(SUM(d.amount_paid), 0) AS total_paid,
        COALESCE(SUM(d.amount_due - d.amount_paid), 0) AS total_pending,
        COUNT(*) AS debt_count,
        SUM(CASE WHEN d.status IN ('pending', 'partially_paid') THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN d.status IN ('pending', 'partially_paid') AND d.due_date IS NOT NULL AND d.due_date >= CURDATE() THEN 1 ELSE 0 END) AS upcoming_count,
        MIN(CASE WHEN d.status IN ('pending', 'partially_paid') AND d.due_date IS NOT NULL THEN d.due_date END) AS next_due_date
      FROM player_debts d
      WHERE d.player_id = ?
    `,
    [playerId]
  );

  const [debts] = await pool.query<PlayerDebtRow[]>(
    `
      SELECT
        d.id,
        d.player_id,
        u.full_name AS player_name,
        d.amount_due,
        d.amount_paid,
        ROUND(d.amount_due - d.amount_paid, 2) AS amount_pending,
        d.description,
        d.status,
        d.due_date,
        d.created_at
      FROM player_debts d
      JOIN players p ON p.id = d.player_id
      JOIN users u ON u.id = p.user_id
      WHERE d.player_id = ?
      ORDER BY
        CASE WHEN d.status = 'paid' THEN 1 ELSE 0 END ASC,
        d.due_date IS NULL ASC,
        d.due_date ASC,
        d.created_at DESC
    `,
    [playerId]
  );

  const [payments] = await pool.query<PlayerDebtPaymentRow[]>(
    `
      SELECT p.id, p.debt_id, p.amount_paid, p.payment_date
      FROM player_debt_payments p
      JOIN player_debts d ON d.id = p.debt_id
      WHERE d.player_id = ?
      ORDER BY p.payment_date DESC, p.id DESC
    `,
    [playerId]
  );

  const [upcomingDebts] = await pool.query<PlayerDebtRow[]>(
    `
      SELECT
        d.id,
        d.player_id,
        u.full_name AS player_name,
        d.amount_due,
        d.amount_paid,
        ROUND(d.amount_due - d.amount_paid, 2) AS amount_pending,
        d.description,
        d.status,
        d.due_date,
        d.created_at
      FROM player_debts d
      JOIN players p ON p.id = d.player_id
      JOIN users u ON u.id = p.user_id
      WHERE d.player_id = ?
        AND d.status IN ('pending', 'partially_paid')
        AND d.due_date IS NOT NULL
        AND d.due_date >= CURDATE()
      ORDER BY d.due_date ASC, d.id ASC
    `,
    [playerId]
  );

  const summary = summaryRows[0] ?? {
    total_due: 0,
    total_paid: 0,
    total_pending: 0,
    debt_count: 0,
    pending_count: 0,
    upcoming_count: 0,
    next_due_date: null,
  };

  res.json({
    summary: {
      totalDue: Number(summary.total_due),
      totalPaid: Number(summary.total_paid),
      totalPending: Number(summary.total_pending),
      debtCount: Number(summary.debt_count),
      pendingCount: Number(summary.pending_count),
      upcomingCount: Number(summary.upcoming_count),
      nextDueDate: summary.next_due_date,
    },
    debts,
    upcomingDebts,
    payments,
  });
});

financeRouter.use(requireRole('ADMIN'));

financeRouter.get('/overview', async (_req, res) => {
  await ensureFinanceSchema();

  const [transactionTotalsRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
      FROM finance_transactions
    `
  );

  const [debtTotalsRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        COALESCE(SUM(amount_due), 0) AS total_debt_due,
        COALESCE(SUM(amount_paid), 0) AS total_debt_paid,
        COALESCE(SUM(amount_due - amount_paid), 0) AS total_debt_pending,
        COUNT(*) AS debt_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN status = 'partially_paid' THEN 1 ELSE 0 END) AS partially_paid_count,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_count
      FROM player_debts
    `
  );

  const totals = transactionTotalsRows[0] ?? {
    total_income: 0,
    total_expense: 0,
  };

  const debtTotals = debtTotalsRows[0] ?? {
    total_debt_due: 0,
    total_debt_paid: 0,
    total_debt_pending: 0,
    debt_count: 0,
    pending_count: 0,
    partially_paid_count: 0,
    paid_count: 0,
  };

  res.json({
    summary: {
      totalIncome: Number(totals.total_income),
      totalExpense: Number(totals.total_expense),
      balance: Number(totals.total_income) - Number(totals.total_expense),
      totalDebtDue: Number(debtTotals.total_debt_due),
      totalDebtPaid: Number(debtTotals.total_debt_paid),
      totalDebtPending: Number(debtTotals.total_debt_pending),
      debtCount: Number(debtTotals.debt_count),
      debtStatusCount: {
        pending: Number(debtTotals.pending_count),
        partiallyPaid: Number(debtTotals.partially_paid_count),
        paid: Number(debtTotals.paid_count),
      },
    },
  });
});

financeRouter.get('/categories', async (req, res) => {
  await ensureFinanceSchema();

  const queryType = req.query.type;
  const hasTypeFilter =
    typeof queryType === 'string' && isFinanceType(queryType);

  const [rows] = await pool.query<FinanceCategoryRow[]>(
    `
      SELECT id, name, type, created_at
      FROM finance_categories
      ${hasTypeFilter ? 'WHERE type = ?' : ''}
      ORDER BY type ASC, name ASC, id DESC
    `,
    hasTypeFilter ? [queryType] : []
  );

  res.json({ categories: rows });
});

financeRouter.post('/categories', async (req, res) => {
  await ensureFinanceSchema();

  const { name, type } = req.body as CreateCategoryBody;
  const nextName = name?.trim();

  if (!nextName || !isFinanceType(type)) {
    res
      .status(400)
      .json({
        message: 'El nombre y el tipo (ingreso|gasto) son obligatorios',
      });
    return;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `
      INSERT INTO finance_categories (name, type)
      VALUES (?, ?)
    `,
    [nextName, type]
  );

  res
    .status(201)
    .json({ id: result.insertId, message: 'Categoría creada exitosamente' });
});

financeRouter.put('/categories/:id', async (req, res) => {
  await ensureFinanceSchema();

  const categoryId = Number(req.params.id);
  const { name, type } = req.body as UpdateCategoryBody;
  const nextName = name?.trim();

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    res.status(400).json({ message: 'ID de categoría inválido' });
    return;
  }

  if (!nextName || !isFinanceType(type)) {
    res
      .status(400)
      .json({
        message: 'El nombre y el tipo (ingreso|gasto) son obligatorios',
      });
    return;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `
      UPDATE finance_categories
      SET name = ?, type = ?
      WHERE id = ?
    `,
    [nextName, type, categoryId]
  );

  if (result.affectedRows === 0) {
    res.status(404).json({ message: 'Categoría no encontrada' });
    return;
  }

  res.json({ message: 'Categoría actualizada exitosamente' });
});

financeRouter.get('/transactions', async (req, res) => {
  await ensureFinanceSchema();

  const queryType = req.query.type;
  const from = typeof req.query.from === 'string' ? req.query.from : '';
  const to = typeof req.query.to === 'string' ? req.query.to : '';
  const filters: string[] = [];
  const params: Array<string> = [];

  if (typeof queryType === 'string' && isFinanceType(queryType)) {
    filters.push('t.type = ?');
    params.push(queryType);
  }

  if (from && isIsoDate(from)) {
    filters.push('t.transaction_date >= ?');
    params.push(from);
  }

  if (to && isIsoDate(to)) {
    filters.push('t.transaction_date <= ?');
    params.push(to);
  }

  const [rows] = await pool.query<FinanceTransactionRow[]>(
    `
      SELECT
        t.id,
        t.category_id,
        c.name AS category_name,
        t.amount,
        t.type,
        t.description,
        t.transaction_date,
        t.created_at
      FROM finance_transactions t
      LEFT JOIN finance_categories c ON c.id = t.category_id
      ${filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''}
      ORDER BY t.transaction_date DESC, t.id DESC
    `,
    params
  );

  res.json({ transactions: rows });
});

financeRouter.post('/transactions', async (req, res) => {
  await ensureFinanceSchema();

  const { categoryId, amount, type, description, transactionDate } =
    req.body as CreateTransactionBody;
  const parsedAmount = toDecimal(amount);
  const nextDescription = description?.trim() || null;

  if (
    !isFinanceType(type) ||
    parsedAmount === null ||
    parsedAmount <= 0 ||
    !transactionDate ||
    !isIsoDate(transactionDate)
  ) {
    res
      .status(400)
      .json({
        message:
          'El tipo, el monto (>0) y la fecha de la transacción (YYYY-MM-DD) son obligatorios',
      });
    return;
  }

  let nextCategoryId: number | null = null;

  if (categoryId !== undefined && categoryId !== null) {
    const parsedCategoryId = Number(categoryId);
    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      res
        .status(400)
        .json({
          message:
            'El ID de categoría debe ser un número entero positivo cuando se proporciona',
        });
      return;
    }

    const [categoryRows] = await pool.query<FinanceCategoryRow[]>(
      'SELECT id, name, type, created_at FROM finance_categories WHERE id = ? LIMIT 1',
      [parsedCategoryId]
    );

    const category = categoryRows[0];

    if (!category) {
      res.status(404).json({ message: 'Categoría no encontrada' });
      return;
    }

    if (category.type !== type) {
      res
        .status(400)
        .json({
          message:
            'El tipo de categoría seleccionada debe coincidir con el tipo de transacción',
        });
      return;
    }

    nextCategoryId = parsedCategoryId;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `
      INSERT INTO finance_transactions (category_id, amount, type, description, transaction_date)
      VALUES (?, ?, ?, ?, ?)
    `,
    [nextCategoryId, parsedAmount, type, nextDescription, transactionDate]
  );

  res
    .status(201)
    .json({ id: result.insertId, message: 'Transacción creada exitosamente' });
});

financeRouter.put('/transactions/:id', async (req, res) => {
  await ensureFinanceSchema();

  const transactionId = Number(req.params.id);
  const { categoryId, amount, type, description, transactionDate } =
    req.body as UpdateTransactionBody;
  const parsedAmount = toDecimal(amount);
  const nextDescription = description?.trim() || null;

  if (!Number.isInteger(transactionId) || transactionId <= 0) {
    res.status(400).json({ message: 'ID de transacción inválido' });
    return;
  }

  if (
    !isFinanceType(type) ||
    parsedAmount === null ||
    parsedAmount <= 0 ||
    !transactionDate ||
    !isIsoDate(transactionDate)
  ) {
    res
      .status(400)
      .json({
        message:
          'El tipo, el monto (>0) y la fecha de la transacción (YYYY-MM-DD) son obligatorios',
      });
    return;
  }

  let nextCategoryId: number | null = null;

  if (categoryId !== undefined && categoryId !== null) {
    const parsedCategoryId = Number(categoryId);
    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      res
        .status(400)
        .json({
          message:
            'El ID de categoría debe ser un número entero positivo cuando se proporciona',
        });
      return;
    }

    const [categoryRows] = await pool.query<FinanceCategoryRow[]>(
      'SELECT id, name, type, created_at FROM finance_categories WHERE id = ? LIMIT 1',
      [parsedCategoryId]
    );

    const category = categoryRows[0];

    if (!category) {
      res.status(404).json({ message: 'Categoría no encontrada' });
      return;
    }

    if (category.type !== type) {
      res
        .status(400)
        .json({
          message:
            'El tipo de categoría seleccionada debe coincidir con el tipo de transacción',
        });
      return;
    }

    nextCategoryId = parsedCategoryId;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `
      UPDATE finance_transactions
      SET category_id = ?, amount = ?, type = ?, description = ?, transaction_date = ?
      WHERE id = ?
    `,
    [
      nextCategoryId,
      parsedAmount,
      type,
      nextDescription,
      transactionDate,
      transactionId,
    ]
  );

  if (result.affectedRows === 0) {
    res.status(404).json({ message: 'Transacción no encontrada' });
    return;
  }

  res.json({ message: 'Transacción actualizada exitosamente' });
});

financeRouter.get('/debts', async (_req, res) => {
  await ensureFinanceSchema();

  const [debts] = await pool.query<PlayerDebtRow[]>(
    `
      SELECT
        d.id,
        d.player_id,
        u.full_name AS player_name,
        d.amount_due,
        d.amount_paid,
        ROUND(d.amount_due - d.amount_paid, 2) AS amount_pending,
        d.description,
        d.status,
        d.due_date,
        d.created_at
      FROM player_debts d
      JOIN players p ON p.id = d.player_id
      JOIN users u ON u.id = p.user_id
      ORDER BY d.created_at DESC, d.id DESC
    `
  );

  const [payments] = await pool.query<PlayerDebtPaymentRow[]>(
    `
      SELECT id, debt_id, amount_paid, payment_date
      FROM player_debt_payments
      ORDER BY payment_date DESC, id DESC
    `
  );

  res.json({ debts, payments });
});

financeRouter.post('/debts', async (req, res) => {
  await ensureFinanceSchema();

  const { playerId, amountDue, description, dueDate } =
    req.body as CreateDebtBody;
  const parsedAmountDue = toDecimal(amountDue);
  const nextDescription = description?.trim() || null;

  if (
    !Number.isInteger(playerId) ||
    Number(playerId) <= 0 ||
    parsedAmountDue === null ||
    parsedAmountDue <= 0
  ) {
    res
      .status(400)
      .json({ message: 'playerId y amountDue (>0) son obligatorios' });
    return;
  }

  if (dueDate && !isIsoDate(dueDate)) {
    res
      .status(400)
      .json({
        message:
          'dueDate debe tener el formato YYYY-MM-DD cuando se proporciona',
      });
    return;
  }

  const [playerRows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM players WHERE id = ? LIMIT 1',
    [playerId]
  );
  if (!playerRows[0]) {
    res.status(404).json({ message: 'Jugador no encontrado' });
    return;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `
      INSERT INTO player_debts (player_id, amount_due, amount_paid, description, status, due_date)
      VALUES (?, ?, 0.00, ?, 'pending', ?)
    `,
    [playerId, parsedAmountDue, nextDescription, dueDate ?? null]
  );

  res
    .status(201)
    .json({ id: result.insertId, message: 'Deuda creada exitosamente' });
});

financeRouter.patch('/debts/:id', async (req, res) => {
  await ensureFinanceSchema();

  const debtId = Number(req.params.id);
  const { amountDue, description, dueDate } = req.body as UpdateDebtBody;
  const parsedAmountDue = amountDue === undefined ? null : toDecimal(amountDue);

  if (!Number.isInteger(debtId) || debtId <= 0) {
    res.status(400).json({ message: 'ID de deuda inválido' });
    return;
  }

  const hasAnyField =
    amountDue !== undefined ||
    description !== undefined ||
    dueDate !== undefined;
  if (!hasAnyField) {
    res
      .status(400)
      .json({
        message: 'Proporcione al menos un campo para actualizar la deuda',
      });
    return;
  }

  if (
    amountDue !== undefined &&
    (parsedAmountDue === null || parsedAmountDue <= 0)
  ) {
    res.status(400).json({ message: 'amountDue debe ser mayor que 0' });
    return;
  }

  if (
    dueDate !== undefined &&
    dueDate !== null &&
    dueDate !== '' &&
    !isIsoDate(dueDate)
  ) {
    res
      .status(400)
      .json({
        message:
          'dueDate debe tener el formato YYYY-MM-DD cuando se proporciona',
      });
    return;
  }

  const [existingRows] = await pool.query<PlayerDebtRow[]>(
    `
      SELECT
        id,
        player_id,
        '' AS player_name,
        amount_due,
        amount_paid,
        ROUND(amount_due - amount_paid, 2) AS amount_pending,
        description,
        status,
        due_date,
        created_at
      FROM player_debts
      WHERE id = ?
      LIMIT 1
    `,
    [debtId]
  );

  const existingDebt = existingRows[0];

  if (!existingDebt) {
    res.status(404).json({ message: 'Deuda no encontrada' });
    return;
  }

  const nextAmountDue = parsedAmountDue ?? Number(existingDebt.amount_due);
  const currentAmountPaid = Number(existingDebt.amount_paid);

  if (nextAmountDue < currentAmountPaid) {
    res
      .status(400)
      .json({
        message: 'amountDue no puede ser menor que el amount_paid actual',
      });
    return;
  }

  const nextPending = Number((nextAmountDue - currentAmountPaid).toFixed(2));
  const nextStatus: 'pending' | 'partially_paid' | 'paid' =
    nextPending <= 0
      ? 'paid'
      : currentAmountPaid > 0
        ? 'partially_paid'
        : 'pending';

  const nextDescription =
    description === undefined
      ? existingDebt.description
      : description?.trim() || null;
  const nextDueDate =
    dueDate === undefined
      ? existingDebt.due_date
      : dueDate === null || dueDate === ''
        ? null
        : dueDate;

  await pool.query(
    `
      UPDATE player_debts
      SET amount_due = ?, description = ?, due_date = ?, status = ?
      WHERE id = ?
    `,
    [nextAmountDue, nextDescription, nextDueDate, nextStatus, debtId]
  );

  res.json({ message: 'Deuda actualizada exitosamente' });
});

financeRouter.post('/debts/:id/payments', async (req, res) => {
  await ensureFinanceSchema();

  const debtId = Number(req.params.id);
  const { amountPaid, paymentDate } = req.body as CreateDebtPaymentBody;
  const parsedAmountPaid = toDecimal(amountPaid);

  if (!Number.isInteger(debtId) || debtId <= 0) {
    res.status(400).json({ message: 'ID de deuda inválido' });
    return;
  }

  if (
    parsedAmountPaid === null ||
    parsedAmountPaid <= 0 ||
    !paymentDate ||
    !isIsoDate(paymentDate)
  ) {
    res
      .status(400)
      .json({
        message: 'amountPaid (>0) y paymentDate (YYYY-MM-DD) son obligatorios',
      });
    return;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [debtRows] = await connection.query<PlayerDebtRow[]>(
      `
        SELECT
          id,
          player_id,
          '' AS player_name,
          amount_due,
          amount_paid,
          ROUND(amount_due - amount_paid, 2) AS amount_pending,
          description,
          status,
          due_date,
          created_at
        FROM player_debts
        WHERE id = ?
        LIMIT 1
      `,
      [debtId]
    );

    const debt = debtRows[0];
    if (!debt) {
      await connection.rollback();
      res.status(404).json({ message: 'Deuda no encontrada' });
      return;
    }

    const currentPending = Number(
      (Number(debt.amount_due) - Number(debt.amount_paid)).toFixed(2)
    );
    if (parsedAmountPaid > currentPending) {
      await connection.rollback();
      res
        .status(400)
        .json({
          message:
            'El monto del pago no puede exceder el monto pendiente de la deuda',
        });
      return;
    }

    await connection.query<ResultSetHeader>(
      `
        INSERT INTO player_debt_payments (debt_id, amount_paid, payment_date)
        VALUES (?, ?, ?)
      `,
      [debtId, parsedAmountPaid, paymentDate]
    );

    const updatedAmountPaid = Number(
      (Number(debt.amount_paid) + parsedAmountPaid).toFixed(2)
    );
    const updatedPending = Number(
      (Number(debt.amount_due) - updatedAmountPaid).toFixed(2)
    );
    const nextStatus: 'pending' | 'partially_paid' | 'paid' =
      updatedPending <= 0
        ? 'paid'
        : updatedAmountPaid > 0
          ? 'partially_paid'
          : 'pending';

    await connection.query(
      `
        UPDATE player_debts
        SET amount_paid = ?, status = ?
        WHERE id = ?
      `,
      [updatedAmountPaid, nextStatus, debtId]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  res.status(201).json({ message: 'Pago de deuda registrado exitosamente' });
});

export { financeRouter };
