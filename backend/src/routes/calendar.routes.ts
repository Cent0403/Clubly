import { Router } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../middleware/auth';

type CalendarEventType = 'partido' | 'entreno' | 'entrega' | 'otro';
type CalendarFrequency = 'diaria' | 'semanal' | 'mensual';
type AttendanceStatus = 'asistira' | 'no_asistira' | 'pendiente' | 'tarde';
type InstanceState = 'programado' | 'cancelado' | 'completado';

interface CalendarEventBody {
  titulo?: string;
  descripcion?: string;
  tipoEvento?: CalendarEventType;
  esRepetitivo?: boolean;
  frecuenciaRepeticion?: CalendarFrequency | null;
  fechaHoraInicio?: string;
  fechaHoraFin?: string;
  fechaFinSerie?: string | null;
  requiereAsistencia?: boolean;
  lugar?: string;
  notas?: string;
  estadoInstancia?: InstanceState;
}

interface CalendarAttendanceBody {
  estadoAsistencia?: AttendanceStatus;
  comentario?: string;
}

interface CalendarAttendeeRow extends RowDataPacket {
  instancia_evento_id: number;
  jugador_id: number;
  full_name: string;
  username: string;
  jersey_number: number | null;
  estado_asistencia: AttendanceStatus;
  comentario: string | null;
  respondido_en: string | null;
}

interface CalendarAdminRow extends RowDataPacket {
  event_id: number;
  titulo: string;
  descripcion: string | null;
  tipo_evento: CalendarEventType;
  es_repetitivo: 0 | 1;
  frecuencia_repeticion: CalendarFrequency | null;
  fecha_inicio_serie: string;
  fecha_fin_serie: string | null;
  creado_en: string;
  actualizado_en: string;
  instance_id: number;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  requiere_asistencia: 0 | 1;
  estado_instancia: InstanceState;
  lugar: string | null;
  notas: string | null;
  count_asistira: number | null;
  count_no_asistira: number | null;
  count_pendiente: number | null;
  count_tarde: number | null;
  responded_count: number | null;
}

interface CalendarPlayerRow extends RowDataPacket {
  event_id: number;
  titulo: string;
  descripcion: string | null;
  tipo_evento: CalendarEventType;
  es_repetitivo: 0 | 1;
  frecuencia_repeticion: CalendarFrequency | null;
  fecha_inicio_serie: string;
  fecha_fin_serie: string | null;
  creado_en: string;
  actualizado_en: string;
  instance_id: number;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  requiere_asistencia: 0 | 1;
  estado_instancia: InstanceState;
  lugar: string | null;
  notas: string | null;
  count_asistira: number | null;
  count_no_asistira: number | null;
  count_pendiente: number | null;
  count_tarde: number | null;
  responded_count: number | null;
  estado_asistencia: AttendanceStatus | null;
  comentario: string | null;
  respondido_en: string | null;
}

interface CalendarCounts {
  asistira: number;
  no_asistira: number;
  pendiente: number;
  tarde: number;
  responded: number;
}

interface CalendarAttendee {
  jugador_id: number;
  full_name: string;
  username: string;
  jersey_number: number | null;
  estado_asistencia: AttendanceStatus;
  comentario: string | null;
  respondido_en: string | null;
}

interface CalendarInstanceResponse {
  id: number;
  event_id: number;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  requiere_asistencia: boolean;
  estado_instancia: InstanceState;
  lugar: string | null;
  notas: string | null;
  attendance_counts: CalendarCounts;
  attending_players: CalendarAttendee[];
  my_response?: {
    estado_asistencia: AttendanceStatus;
    comentario: string | null;
    respondido_en: string | null;
  } | null;
}

interface CalendarEventResponse {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipo_evento: CalendarEventType;
  es_repetitivo: boolean;
  frecuencia_repeticion: CalendarFrequency | null;
  fecha_inicio_serie: string;
  fecha_fin_serie: string | null;
  creado_en: string;
  actualizado_en: string;
  instances: CalendarInstanceResponse[];
}

const calendarRouter = Router();

calendarRouter.use(requireAuth);

function parseDateTime(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Fecha y hora inválidas');
  }

  return date;
}

function formatDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addFrequency(date: Date, frequency: CalendarFrequency): Date {
  const nextDate = new Date(date);

  if (frequency === 'diaria') {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (frequency === 'semanal') {
    nextDate.setDate(nextDate.getDate() + 7);
  } else {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate;
}

function buildOccurrences(start: Date, end: Date, frequency: CalendarFrequency | null, untilDate: string | null) {
  const occurrences: Array<{ start: Date; end: Date }> = [];

  if (!frequency) {
    return [{ start, end }];
  }

  if (!untilDate) {
    throw new Error('Debe indicar fecha_fin_serie para eventos repetitivos');
  }

  const until = parseDateTime(`${untilDate}T23:59:59`);
  let currentStart = new Date(start);
  let currentEnd = new Date(end);

  while (currentStart <= until) {
    occurrences.push({ start: new Date(currentStart), end: new Date(currentEnd) });
    currentStart = addFrequency(currentStart, frequency);
    currentEnd = addFrequency(currentEnd, frequency);
  }

  return occurrences;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const nextValue = value.trim();
  return nextValue.length > 0 ? nextValue : null;
}

function normalizeResponseCounts(row: Pick<CalendarAdminRow, 'count_asistira' | 'count_no_asistira' | 'count_pendiente' | 'count_tarde' | 'responded_count'>): CalendarCounts {
  return {
    asistira: Number(row.count_asistira ?? 0),
    no_asistira: Number(row.count_no_asistira ?? 0),
    pendiente: Number(row.count_pendiente ?? 0),
    tarde: Number(row.count_tarde ?? 0),
    responded: Number(row.responded_count ?? 0)
  };
}

function emptyAttendeeMap(): Map<number, CalendarAttendee[]> {
  return new Map<number, CalendarAttendee[]>();
}

async function loadAttendingPlayers(): Promise<Map<number, CalendarAttendee[]>> {
  const [rows] = await pool.query<CalendarAttendeeRow[]>(
    `
      SELECT
        ae.instancia_evento_id,
        ae.jugador_id,
        u.full_name,
        u.username,
        p.jersey_number,
        ae.estado_asistencia,
        ae.comentario,
        ae.respondido_en
      FROM attendance_event ae
      INNER JOIN players p ON p.id = ae.jugador_id
      INNER JOIN users u ON u.id = p.user_id
      WHERE ae.estado_asistencia = 'asistira'
      ORDER BY u.full_name ASC, p.jersey_number ASC
    `
  );

  const attendeeMap = emptyAttendeeMap();

  for (const row of rows) {
    const current = attendeeMap.get(row.instancia_evento_id) ?? [];
    current.push({
      jugador_id: row.jugador_id,
      full_name: row.full_name,
      username: row.username,
      jersey_number: row.jersey_number,
      estado_asistencia: row.estado_asistencia,
      comentario: row.comentario,
      respondido_en: row.respondido_en
    });
    attendeeMap.set(row.instancia_evento_id, current);
  }

  return attendeeMap;
}

async function loadAdminCalendarEvents(): Promise<CalendarEventResponse[]> {
  const [rows] = await pool.query<CalendarAdminRow[]>(
    `
      SELECT
        e.id AS event_id,
        e.titulo,
        e.descripcion,
        e.tipo_evento,
        e.es_repetitivo,
        e.frecuencia_repeticion,
        e.fecha_inicio_serie,
        e.fecha_fin_serie,
        e.creado_en,
        e.actualizado_en,
        ei.id AS instance_id,
        ei.fecha_hora_inicio,
        ei.fecha_hora_fin,
        ei.requiere_asistencia,
        ei.estado_instancia,
        ei.lugar,
        ei.notas,
        stats.count_asistira,
        stats.count_no_asistira,
        stats.count_pendiente,
        stats.count_tarde,
        stats.responded_count
      FROM events e
      INNER JOIN events_instances ei ON ei.evento_id = e.id
      LEFT JOIN (
        SELECT
          instancia_evento_id,
          SUM(estado_asistencia = 'asistira') AS count_asistira,
          SUM(estado_asistencia = 'no_asistira') AS count_no_asistira,
          SUM(estado_asistencia = 'pendiente') AS count_pendiente,
          SUM(estado_asistencia = 'tarde') AS count_tarde,
          COUNT(*) AS responded_count
        FROM attendance_event
        GROUP BY instancia_evento_id
      ) stats ON stats.instancia_evento_id = ei.id
      ORDER BY ei.fecha_hora_inicio ASC, e.id DESC
    `
  );
  const attendingPlayers = await loadAttendingPlayers();

  const eventMap = new Map<number, CalendarEventResponse>();

  for (const row of rows) {
    const existingEvent = eventMap.get(row.event_id);
    const instance: CalendarInstanceResponse = {
      id: row.instance_id,
      event_id: row.event_id,
      fecha_hora_inicio: row.fecha_hora_inicio,
      fecha_hora_fin: row.fecha_hora_fin,
      requiere_asistencia: row.requiere_asistencia === 1,
      estado_instancia: row.estado_instancia,
      lugar: row.lugar,
      notas: row.notas,
      attendance_counts: normalizeResponseCounts(row),
      attending_players: attendingPlayers.get(row.instance_id) ?? []
    };

    if (existingEvent) {
      existingEvent.instances.push(instance);
      continue;
    }

    eventMap.set(row.event_id, {
      id: row.event_id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      tipo_evento: row.tipo_evento,
      es_repetitivo: row.es_repetitivo === 1,
      frecuencia_repeticion: row.frecuencia_repeticion,
      fecha_inicio_serie: row.fecha_inicio_serie,
      fecha_fin_serie: row.fecha_fin_serie,
      creado_en: row.creado_en,
      actualizado_en: row.actualizado_en,
      instances: [instance]
    });
  }

  return Array.from(eventMap.values());
}

async function loadPlayerCalendarEvents(playerId: number): Promise<CalendarEventResponse[]> {
  const [rows] = await pool.query<CalendarPlayerRow[]>(
    `
      SELECT
        e.id AS event_id,
        e.titulo,
        e.descripcion,
        e.tipo_evento,
        e.es_repetitivo,
        e.frecuencia_repeticion,
        e.fecha_inicio_serie,
        e.fecha_fin_serie,
        e.creado_en,
        e.actualizado_en,
        ei.id AS instance_id,
        ei.fecha_hora_inicio,
        ei.fecha_hora_fin,
        ei.requiere_asistencia,
        ei.estado_instancia,
        ei.lugar,
        ei.notas,
        stats.count_asistira,
        stats.count_no_asistira,
        stats.count_pendiente,
        stats.count_tarde,
        stats.responded_count,
        a.estado_asistencia,
        a.comentario,
        a.respondido_en
      FROM events e
      INNER JOIN events_instances ei ON ei.evento_id = e.id
      LEFT JOIN (
        SELECT
          instancia_evento_id,
          SUM(estado_asistencia = 'asistira') AS count_asistira,
          SUM(estado_asistencia = 'no_asistira') AS count_no_asistira,
          SUM(estado_asistencia = 'pendiente') AS count_pendiente,
          SUM(estado_asistencia = 'tarde') AS count_tarde,
          COUNT(*) AS responded_count
        FROM attendance_event
        GROUP BY instancia_evento_id
      ) stats ON stats.instancia_evento_id = ei.id
      LEFT JOIN attendance_event a
        ON a.instancia_evento_id = ei.id
       AND a.jugador_id = ?
      ORDER BY ei.fecha_hora_inicio ASC, e.id DESC
    `,
    [playerId]
  );
  const attendingPlayers = await loadAttendingPlayers();

  const eventMap = new Map<number, CalendarEventResponse>();

  for (const row of rows) {
    const existingEvent = eventMap.get(row.event_id);
    const myResponse = row.estado_asistencia
      ? {
          estado_asistencia: row.estado_asistencia,
          comentario: row.comentario,
          respondido_en: row.respondido_en
        }
      : null;

    const instance: CalendarInstanceResponse = {
      id: row.instance_id,
      event_id: row.event_id,
      fecha_hora_inicio: row.fecha_hora_inicio,
      fecha_hora_fin: row.fecha_hora_fin,
      requiere_asistencia: row.requiere_asistencia === 1,
      estado_instancia: row.estado_instancia,
      lugar: row.lugar,
      notas: row.notas,
      attendance_counts: normalizeResponseCounts(row),
      attending_players: attendingPlayers.get(row.instance_id) ?? [],
      my_response: myResponse
    };

    if (existingEvent) {
      existingEvent.instances.push(instance);
      continue;
    }

    eventMap.set(row.event_id, {
      id: row.event_id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      tipo_evento: row.tipo_evento,
      es_repetitivo: row.es_repetitivo === 1,
      frecuencia_repeticion: row.frecuencia_repeticion,
      fecha_inicio_serie: row.fecha_inicio_serie,
      fecha_fin_serie: row.fecha_fin_serie,
      creado_en: row.creado_en,
      actualizado_en: row.actualizado_en,
      instances: [instance]
    });
  }

  return Array.from(eventMap.values());
}

calendarRouter.get('/', async (req, res) => {
  if (req.user?.role === 'ADMIN') {
    const events = await loadAdminCalendarEvents();
    res.json({ events });
    return;
  }

  if (!req.user?.playerId) {
    res.status(404).json({ message: 'Perfil de jugador no encontrado para este usuario' });
    return;
  }

  const events = await loadPlayerCalendarEvents(req.user.playerId);
  res.json({ events });
});

calendarRouter.post('/', requireRole('ADMIN'), async (req, res) => {
  const {
    titulo,
    descripcion,
    tipoEvento,
    esRepetitivo = false,
    frecuenciaRepeticion = null,
    fechaHoraInicio,
    fechaHoraFin,
    fechaFinSerie = null,
    requiereAsistencia = true,
    lugar,
    notas
  } = req.body as CalendarEventBody;

  if (!titulo?.trim() || !tipoEvento || !fechaHoraInicio || !fechaHoraFin) {
    res.status(400).json({ message: 'titulo, tipoEvento, fechaHoraInicio y fechaHoraFin son obligatorios' });
    return;
  }

  if (!['partido', 'entreno', 'entrega', 'otro'].includes(tipoEvento)) {
    res.status(400).json({ message: 'tipoEvento debe ser partido, entreno, entrega u otro' });
    return;
  }

  if (esRepetitivo && !frecuenciaRepeticion) {
    res.status(400).json({ message: 'La frecuencia es obligatoria cuando el evento es repetitivo' });
    return;
  }

  if (frecuenciaRepeticion && !['diaria', 'semanal', 'mensual'].includes(frecuenciaRepeticion)) {
    res.status(400).json({ message: 'frecuenciaRepeticion inválida' });
    return;
  }

  if (!esRepetitivo && frecuenciaRepeticion) {
    res.status(400).json({ message: 'No debe enviar frecuenciaRepeticion para un evento único' });
    return;
  }

  const start = parseDateTime(fechaHoraInicio);
  const end = parseDateTime(fechaHoraFin);

  if (end <= start) {
    res.status(400).json({ message: 'fechaHoraFin debe ser posterior a fechaHoraInicio' });
    return;
  }

  if (esRepetitivo && !fechaFinSerie) {
    res.status(400).json({ message: 'fechaFinSerie es obligatoria para eventos repetitivos' });
    return;
  }

  if (fechaFinSerie) {
    const seriesEnd = new Date(`${fechaFinSerie}T23:59:59`);
    if (seriesEnd < start) {
      res.status(400).json({ message: 'fechaFinSerie no puede ser anterior al primer evento' });
      return;
    }
  }

  const occurrences = buildOccurrences(start, end, esRepetitivo ? frecuenciaRepeticion : null, fechaFinSerie);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [eventResult] = await connection.query<ResultSetHeader>(
      `
        INSERT INTO events (
          titulo,
          descripcion,
          tipo_evento,
          es_repetitivo,
          frecuencia_repeticion,
          fecha_inicio_serie,
          fecha_fin_serie
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        titulo.trim(),
        normalizeText(descripcion),
        tipoEvento,
        esRepetitivo ? 1 : 0,
        esRepetitivo ? frecuenciaRepeticion : null,
        formatDateOnly(start),
        fechaFinSerie ?? null
      ]
    );

    for (const occurrence of occurrences) {
      await connection.query(
        `
          INSERT INTO events_instances (
            evento_id,
            fecha_hora_inicio,
            fecha_hora_fin,
            requiere_asistencia,
            estado_instancia,
            lugar,
            notas
          ) VALUES (?, ?, ?, ?, 'programado', ?, ?)
        `,
        [
          eventResult.insertId,
          occurrence.start,
          occurrence.end,
          requiereAsistencia ? 1 : 0,
          normalizeText(lugar),
          normalizeText(notas)
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Evento de calendario creado correctamente',
      eventId: eventResult.insertId,
      instancesCreated: occurrences.length
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

calendarRouter.put('/instances/:instanceId', requireRole('ADMIN'), async (req, res) => {
  const instanceId = Number(req.params.instanceId);

  if (!Number.isInteger(instanceId) || instanceId <= 0) {
    res.status(400).json({ message: 'ID de instancia inválido' });
    return;
  }

  const {
    titulo,
    descripcion,
    tipoEvento,
    fechaHoraInicio,
    fechaHoraFin,
    requiereAsistencia = true,
    lugar,
    notas,
    estadoInstancia
  } = req.body as CalendarEventBody;

  if (!titulo?.trim() || !tipoEvento || !fechaHoraInicio || !fechaHoraFin) {
    res.status(400).json({ message: 'titulo, tipoEvento, fechaHoraInicio y fechaHoraFin son obligatorios' });
    return;
  }

  if (!['partido', 'entreno', 'entrega', 'otro'].includes(tipoEvento)) {
    res.status(400).json({ message: 'tipoEvento debe ser partido, entreno, entrega u otro' });
    return;
  }

  if (estadoInstancia && !['programado', 'cancelado', 'completado'].includes(estadoInstancia)) {
    res.status(400).json({ message: 'estadoInstancia inválido' });
    return;
  }

  const start = parseDateTime(fechaHoraInicio);
  const end = parseDateTime(fechaHoraFin);

  if (end <= start) {
    res.status(400).json({ message: 'fechaHoraFin debe ser posterior a fechaHoraInicio' });
    return;
  }

  const [instanceRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        ei.id,
        ei.evento_id
      FROM events_instances ei
      WHERE ei.id = ?
      LIMIT 1
    `,
    [instanceId]
  );

  const instance = instanceRows[0];

  if (!instance) {
    res.status(404).json({ message: 'Instancia de evento no encontrada' });
    return;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `
        UPDATE events
        SET
          titulo = ?,
          descripcion = ?,
          tipo_evento = ?,
          actualizado_en = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [titulo.trim(), normalizeText(descripcion), tipoEvento, instance.evento_id]
    );

    await connection.query(
      `
        UPDATE events_instances
        SET
          fecha_hora_inicio = ?,
          fecha_hora_fin = ?,
          requiere_asistencia = ?,
          estado_instancia = ?,
          lugar = ?,
          notas = ?,
          actualizado_en = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        start,
        end,
        requiereAsistencia ? 1 : 0,
        estadoInstancia ?? 'programado',
        normalizeText(lugar),
        normalizeText(notas),
        instanceId
      ]
    );

    await connection.commit();

    res.json({ message: 'Evento actualizado correctamente' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

calendarRouter.post('/instances/:instanceId/attendance', requireRole('PLAYER'), async (req, res) => {
  const instanceId = Number(req.params.instanceId);

  if (!Number.isInteger(instanceId) || instanceId <= 0) {
    res.status(400).json({ message: 'ID de instancia inválido' });
    return;
  }

  if (!req.user?.playerId) {
    res.status(404).json({ message: 'Perfil de jugador no encontrado para este usuario' });
    return;
  }

  const { estadoAsistencia = 'pendiente', comentario } = req.body as CalendarAttendanceBody;

  if (!['asistira', 'no_asistira', 'pendiente', 'tarde'].includes(estadoAsistencia)) {
    res.status(400).json({ message: 'estadoAsistencia inválido' });
    return;
  }

  const [instanceRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT id, requiere_asistencia, estado_instancia
      FROM events_instances
      WHERE id = ?
      LIMIT 1
    `,
    [instanceId]
  );

  const instance = instanceRows[0];

  if (!instance) {
    res.status(404).json({ message: 'Instancia de evento no encontrada' });
    return;
  }

  if (instance.estado_instancia === 'cancelado') {
    res.status(409).json({ message: 'La instancia está cancelada' });
    return;
  }

  if (!instance.requiere_asistencia) {
    res.status(409).json({ message: 'Esta instancia no tiene encuesta de asistencia activa' });
    return;
  }

  await pool.query(
    `
      INSERT INTO attendance_event (
        instancia_evento_id,
        jugador_id,
        estado_asistencia,
        comentario,
        respondido_en
      ) VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        estado_asistencia = VALUES(estado_asistencia),
        comentario = VALUES(comentario),
        respondido_en = NOW()
    `,
    [instanceId, req.user.playerId, estadoAsistencia, normalizeText(comentario)]
  );

  res.json({ message: 'Respuesta de asistencia guardada correctamente' });
});

export { calendarRouter };