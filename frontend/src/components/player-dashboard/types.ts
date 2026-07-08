import type { ComponentType, SVGProps } from 'react';
import { GlobalStats, MatchRatingRow, PlayerHistoryItem, PlayerItem, PlayerSummary } from '../../types';
import { FinanceDebt, FinanceDebtPayment, PlayerFinanceDebtSummary } from '../../types';

export interface PlayerDashboardProps {
  token: string;
  onLogout: () => void;
}

export interface ProfileFormState {
  fullName: string;
  password: string;
  jerseyNumber: number | null;
}

export interface PlayerSection {
  key: 'resumen' | 'rendimiento' | 'historial' | 'calendario' | 'finanzas' | 'top' | 'perfil' ;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export type PlayerSectionKey = PlayerSection['key'];

export interface RadarMetric {
  label: string;
  value: number;
}

export interface SummaryCard {
  label: string;
  value: number;
  accent: string;
}

export interface SummarySectionProps {
  active: boolean;
  globalStats: GlobalStats | null;
}

export interface ProfileSectionProps {
  active: boolean;
  profile: PlayerItem | null;
  summary: PlayerSummary | null;
  onOpenProfileModal: () => void;
}

export interface PerformanceSectionProps {
  active: boolean;
  summary: PlayerSummary | null;
  radarMetrics: RadarMetric[];
  history: PlayerHistoryItem[];
}

export interface TopSectionProps {
  active: boolean;
  topPlayers: PlayerItem[];
}

export interface HistorySectionProps {
  active: boolean;
  history: PlayerHistoryItem[];
  selectedMatch: PlayerHistoryItem | null;
  matchRatings: MatchRatingRow[];
  matchRatingsLoading: boolean;
  onSelectMatch: (match: PlayerHistoryItem) => void;
}

export interface FinanceSectionProps {
  active: boolean;
  summary: PlayerFinanceDebtSummary | null;
  debts: FinanceDebt[];
  upcomingDebts: FinanceDebt[];
  payments: FinanceDebtPayment[];
}

export interface CalendarSectionProps {
  active: boolean;
  events: import('../../types').CalendarEvent[];
  savingAttendanceInstanceId: number | null;
  onSubmitAttendance: (
    instanceId: number,
    payload: { estadoAsistencia: import('../../types').AttendanceStatus; comentario: string }
  ) => Promise<void>;
}
