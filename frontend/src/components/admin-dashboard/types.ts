import { PlayerPosition, RatingItem, Role, TeamSettings } from '../../types';

export interface AdminDashboardProps {
  token: string;
  teamSettings: TeamSettings;
  onTeamSettingsUpdated: (settings: TeamSettings) => void;
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
  key: 'dashboard' | 'personalización' | 'usuarios' | 'partidos' | 'top';
  label: string;
}

export type AdminSectionKey = AdminSection['key'];
