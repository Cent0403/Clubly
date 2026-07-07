import { CalendarEvent, CalendarEventType, CalendarFrequency, PlayerPosition, RatingItem, Role, TeamSettings } from '../../types';

export interface AdminDashboardProps {
  token: string;
  teamSettings: TeamSettings;
  onTeamSettingsUpdated: (settings: TeamSettings) => void;
}

export interface CalendarEventFormState {
  titulo: string;
  descripcion: string;
  tipoEvento: CalendarEventType;
  esRepetitivo: boolean;
  frecuenciaRepeticion: '' | CalendarFrequency;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  fechaFinSerie: string;
  requiereAsistencia: boolean;
  lugar: string;
}

export interface MatchFormState {
  matchDate: string;
  opponent: string;
  tournament: string;
  location: string;
  notes: string;
}

export interface UserFormState {
  username: string;
  password: string;
  fullName: string;
  role: Role;
  jerseyNumber: string;
  position: '' | PlayerPosition;
}

export interface EditUserFormState {
  username: string;
  password: string;
  fullName: string;
  role: Role;
  jerseyNumber: string;
  position: '' | PlayerPosition;
}

export type EventFieldKey = keyof Omit<RatingItem, 'playerId' | 'minutesPlayed'>;

export interface AdminSection {
  key: 'dashboard' | 'personalización' | 'usuarios' | 'partidos' | 'calendario' | 'finanzas' | 'top';
  label: string;
}

export type AdminSectionKey = AdminSection['key'];

export interface CalendarSectionProps {
  active: boolean;
  events: CalendarEvent[];
  calendarForm: CalendarEventFormState;
  editingCalendarInstanceId: number | null;
  savingCalendarEvent: boolean;
  onCalendarFormChange: (updater: (current: CalendarEventFormState) => CalendarEventFormState) => void;
  onCreateCalendarEvent: (event: React.FormEvent<HTMLFormElement>) => void;
  onEditCalendarEvent: (event: CalendarEvent, instanceId: number) => void;
  onDeleteCalendarEvent: (event: CalendarEvent, instanceId: number) => void;
  onCancelEditCalendarEvent: () => void;
}
