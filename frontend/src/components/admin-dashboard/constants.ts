import { RatingItem } from '../../types';
import { AdminSection, EditUserFormState, EventFieldKey, MatchFormState, UserFormState } from './types';

export const EMPTY_MATCH_FORM: MatchFormState = {
  matchDate: '',
  opponent: '',
  tournament: '',
  location: '',
  notes: ''
};

export const EMPTY_USER_FORM: UserFormState = {
  username: '',
  password: '',
  fullName: '',
  role: 'PLAYER',
  jerseyNumber: '',
  position: ''
};

export const EMPTY_EDIT_USER_FORM: EditUserFormState = {
  username: '',
  password: '',
  fullName: '',
  role: 'PLAYER',
  jerseyNumber: '',
  position: ''
};

export const USER_POSITIONS: Array<UserFormState['position']> = [
  '',
  'SETTER',
  'OUTSIDE',
  'OPPOSITE',
  'MIDDLE',
  'LIBERO'
];

export const POSITION_LABELS: Record<Exclude<UserFormState['position'], ''>, string> = {
  SETTER: 'Colocador',
  OUTSIDE: 'Latero',
  OPPOSITE: 'Opuesto',
  MIDDLE: 'Central',
  LIBERO: 'Libero'
};

export const POSITION_OPTION_LABELS: Record<Exclude<UserFormState['position'], ''>, string> = {
  SETTER: 'Colocador',
  OUTSIDE: 'Latero',
  OPPOSITE: 'Opuesto',
  MIDDLE: 'Central',
  LIBERO: 'Libero'
};

export const EVENT_FIELDS: Array<{ key: EventFieldKey; label: string }> = [
  { key: 'attackPoints', label: 'Ataque: puntos' },
  { key: 'attackComplicated', label: 'Ataque: complicado' },
  { key: 'attackErrors', label: 'Ataque: errores' },
  { key: 'serveAces', label: 'Saque: aces' },
  { key: 'serveComplicated', label: 'Saque: complicado' },
  { key: 'servePasarlo', label: 'Saque: pasarlo' },
  { key: 'serveErrors', label: 'Saque: errores' },
  { key: 'blockPoints', label: 'Bloqueo: puntos' },
  { key: 'blockTouches', label: 'Bloqueo: toques' },
  { key: 'defenseSuccesses', label: 'Defensa: exitosas' },
  { key: 'receptionPerfect', label: 'Recepcion: perfectas' },
  { key: 'receptionGood', label: 'Recepcion: buenas' },
  { key: 'receptionBad', label: 'Recepcion: malas' },
  { key: 'receptionError', label: 'Recepcion: errores' },
  { key: 'setAssists', label: 'Armado: asistencias' },
  { key: 'setErrors', label: 'Armado: errores' }
];

export const FUNDAMENT_GROUPS = [
  {
    title: 'Recepcion',
    description: 'Perfectas, buenas, malas y error',
    fields: ['receptionPerfect', 'receptionGood', 'receptionBad', 'receptionError'] as const
  },
  {
    title: 'Ataque',
    description: 'Puntos y errores',
    fields: ['attackPoints', 'attackComplicated', 'attackErrors'] as const
  },
  {
    title: 'Saque',
    description: 'Aces, complicados y errores',
    fields: ['serveAces', 'serveComplicated', 'servePasarlo', 'serveErrors'] as const
  },
  {
    title: 'Bloqueo',
    description: 'Puntos y toques',
    fields: ['blockPoints', 'blockTouches'] as const
  },
  {
    title: 'Defensa',
    description: 'Defensas exitosas',
    fields: ['defenseSuccesses'] as const
  },
  {
    title: 'Armado',
    description: 'Asistencias y errores',
    fields: ['setAssists', 'setErrors'] as const
  }
] as const;

export const TOP_RANKINGS = [
  { key: 'reception', title: 'Top recepción' },
  { key: 'serve', title: 'Top saque' },
  { key: 'defense', title: 'Top defensa' },
  { key: 'attack', title: 'Top ataque' },
  { key: 'block', title: 'Top bloqueo' },
  { key: 'setting', title: 'Top armado' }
] as const;

export const ADMIN_SECTIONS: AdminSection[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'personalización', label: 'Personalización' },
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'partidos', label: 'Partidos' },
  { key: 'top', label: 'Top' }
];

export function createDefaultRating(playerId: number): RatingItem {
  return {
    playerId,
    minutesPlayed: true,
    attackPoints: 0,
    attackComplicated: 0,
    attackErrors: 0,
    serveAces: 0,
    serveComplicated: 0,
    servePasarlo: 0,
    serveErrors: 0,
    blockPoints: 0,
    blockTouches: 0,
    defenseSuccesses: 0,
    receptionPerfect: 0,
    receptionGood: 0,
    receptionBad: 0,
    receptionError: 0,
    setAssists: 0,
    setErrors: 0
  };
}
