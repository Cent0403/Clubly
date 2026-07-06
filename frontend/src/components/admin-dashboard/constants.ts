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
  { key: 'setsPlayed', label: 'Sets jugados' },
  { key: 'attackPoints', label: 'Ataque: puntos' },
  { key: 'attackErrors', label: 'Ataque: errores' },
  { key: 'attackAttempts', label: 'Ataque: intentos' },
  { key: 'serveAces', label: 'Saque: aces' },
  { key: 'serveErrors', label: 'Saque: errores' },
  { key: 'serveAttempts', label: 'Saque: intentos' },
  { key: 'blockKill', label: 'Bloqueo: cantidad de acciones de 2 puntos' },
  { key: 'blockTouch', label: 'Bloqueo: cantidad de acciones de 1 punto' },
  { key: 'blockError', label: 'Bloqueo: cantidad de acciones de 0 puntos' },
  { key: 'defenseSuccesses', label: 'Defensa: exitosas' },
  { key: 'defenseFailures', label: 'Defensa: fallidas' },
  { key: 'receptionThree', label: 'Recepcion: 3' },
  { key: 'receptionTwo', label: 'Recepcion: 2' },
  { key: 'receptionOne', label: 'Recepcion: 1' },
  { key: 'receptionZero', label: 'Recepcion: 0' },
  { key: 'setAssists', label: 'Armado: asistencias' },
  { key: 'setErrors', label: 'Armado: errores' },
  { key: 'setAttempts', label: 'Armado: intentos' }
];

export const FUNDAMENT_GROUPS = [
  {
    title: 'Contexto',
    description: 'Sets disputados por la jugadora o jugador',
    fields: ['setsPlayed'] as const
  },
  {
    title: 'Recepcion',
    description: 'Valoraciones 3, 2, 1 y 0',
    fields: ['receptionThree', 'receptionTwo', 'receptionOne', 'receptionZero'] as const
  },
  {
    title: 'Ataque',
    description: 'Puntos, errores e intentos',
    fields: ['attackPoints', 'attackErrors', 'attackAttempts'] as const
  },
  {
    title: 'Saque',
    description: 'Aces, errores e intentos',
    fields: ['serveAces', 'serveErrors', 'serveAttempts'] as const
  },
  {
    title: 'Bloqueo',
    description: 'Ingresa cantidades por categoria. El total se calcula como 2 + 1 + 0',
    fields: ['blockKill', 'blockTouch', 'blockError'] as const
  },
  {
    title: 'Defensa',
    description: 'Defensas exitosas y fallidas',
    fields: ['defenseSuccesses', 'defenseFailures'] as const
  },
  {
    title: 'Armado',
    description: 'Asistencias, errores e intentos',
    fields: ['setAssists', 'setErrors', 'setAttempts'] as const
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
  { key: 'finanzas', label: 'Finanzas' },
  { key: 'top', label: 'Top' }
];

export function createDefaultRating(playerId: number): RatingItem {
  return {
    playerId,
    minutesPlayed: true,
    setsPlayed: 0,
    attackPoints: 0,
    attackErrors: 0,
    attackAttempts: 0,
    serveAces: 0,
    serveErrors: 0,
    serveAttempts: 0,
    blockKill: 0,
    blockTouch: 0,
    blockError: 0,
    defenseSuccesses: 0,
    defenseFailures: 0,
    receptionThree: 0,
    receptionTwo: 0,
    receptionOne: 0,
    receptionZero: 0,
    setAssists: 0,
    setErrors: 0,
    setAttempts: 0
  };
}
