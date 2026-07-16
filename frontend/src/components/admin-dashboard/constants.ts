import { RatingItem } from "../../types";
import {
  AdminSection,
  CalendarEventFormState,
  EditUserFormState,
  EventFieldKey,
  MatchFormState,
  UserFormState,
} from "./types";
import {
  CalendarIcon,
  TopIcon,
  DashboardIcon,
  FinancesIcon,
  MatchesIcon,
  PersonalizationIcon,
  UsersIcon,
} from "../icons/SidebarIcons";

export const EMPTY_MATCH_FORM: MatchFormState = {
  matchDate: "",
  opponent: "",
  tournament: "",
  location: "",
  notes: "",
};

export const EMPTY_USER_FORM: UserFormState = {
  username: "",
  password: "",
  fullName: "",
  role: "PLAYER",
  jerseyNumber: "",
  position: "",
  secondaryPosition: "",
};

export const EMPTY_EDIT_USER_FORM: EditUserFormState = {
  username: "",
  password: "",
  fullName: "",
  role: "PLAYER",
  jerseyNumber: "",
  position: "",
  secondaryPosition: "",
};

export const EMPTY_CALENDAR_EVENT_FORM: CalendarEventFormState = {
  titulo: "",
  descripcion: "",
  tipoEvento: "entreno",
  esRepetitivo: false,
  frecuenciaRepeticion: "semanal",
  fechaHoraInicio: "",
  fechaHoraFin: "",
  fechaFinSerie: "",
  requiereAsistencia: true,
  lugar: "",
};

export const USER_POSITIONS: Array<UserFormState["position"]> = [
  "",
  "SETTER",
  "OUTSIDE",
  "OPPOSITE",
  "MIDDLE",
  "LIBERO",
];

export const POSITION_LABELS: Record<
  Exclude<UserFormState["position"], "">,
  string
> = {
  SETTER: "Colocador",
  OUTSIDE: "Latero",
  OPPOSITE: "Opuesto",
  MIDDLE: "Central",
  LIBERO: "Libero",
};

export const POSITION_OPTION_LABELS: Record<
  Exclude<UserFormState["position"], "">,
  string
> = {
  SETTER: "Colocador",
  OUTSIDE: "Latero",
  OPPOSITE: "Opuesto",
  MIDDLE: "Central",
  LIBERO: "Libero",
};

export const EVENT_FIELDS: Array<{ key: EventFieldKey; label: string }> = [
  { key: "setsPlayed", label: "Sets jugados" },
  { key: "attackPoints", label: "Ataque: Directo" },
  { key: "attackErrors", label: "Ataque: Error" },
  { key: "attackAttempts", label: "Ataque: Intentos" },
  { key: "serveAces", label: "Saque: Ace" },
  { key: "serveErrors", label: "Saque: Error" },
  { key: "serveAttempts", label: "Saque: Intentos" },
  { key: "blockKill", label: "Bloqueo: Bloqueo exitoso" },
  { key: "blockTouch", label: "Bloqueo: Toque" },
  { key: "blockError", label: "Bloqueo: Error" },
  { key: "defenseSuccesses", label: "Defensa: Exitosa" },
  { key: "defenseFailures", label: "Defensa: Fallida" },
  { key: "receptionThree", label: "Recepcion: Perfecta" },
  { key: "receptionTwo", label: "Recepcion: Buena" },
  { key: "receptionOne", label: "Recepcion: Mala" },
  { key: "receptionZero", label: "Recepcion: Error" },
  { key: "setAssists", label: "Armado: Asistencia" },
  { key: "setErrors", label: "Armado: Error" },
  { key: "setAttempts", label: "Armado: Intentos" },
];

export const FUNDAMENT_GROUPS = [
  {
    title: "Contexto",
    description: "Sets disputados por la jugadora o jugador",
    fields: ["setsPlayed"] as const,
  },
  {
    title: "Recepcion",
    description: "Valoraciones 3, 2, 1 y 0",
    fields: [
      "receptionThree",
      "receptionTwo",
      "receptionOne",
      "receptionZero",
    ] as const,
  },
  {
    title: "Ataque",
    description: "Puntos, errores e intentos",
    fields: ["attackPoints", "attackErrors", "attackAttempts"] as const,
  },
  {
    title: "Saque",
    description: "Aces, errores e intentos",
    fields: ["serveAces", "serveErrors", "serveAttempts"] as const,
  },
  {
    title: "Bloqueo",
    description:
      "Valoraciones 2, 1 y 0",
    fields: ["blockKill", "blockTouch", "blockError"] as const,
  },
  {
    title: "Defensa",
    description: "Defensas exitosas y fallidas",
    fields: ["defenseSuccesses", "defenseFailures"] as const,
  },
  {
    title: "Armado",
    description: "Asistencias, errores e intentos",
    fields: ["setAssists", "setErrors", "setAttempts"] as const,
  },
] as const;

export const TOP_RANKINGS = [
  { key: "reception", title: "Top recepción" },
  { key: "serve", title: "Top saque" },
  { key: "defense", title: "Top defensa" },
  { key: "attack", title: "Top ataque" },
  { key: "block", title: "Top bloqueo" },
  { key: "setting", title: "Top armado" },
] as const;

export const ADMIN_SECTIONS: AdminSection[] = [
  { key: "dashboard", label: "Dashboard", icon: DashboardIcon },
  {
    key: "personalización",
    label: "Personalización",
    icon: PersonalizationIcon,
  },
  { key: "usuarios", label: "Usuarios", icon: UsersIcon },
  { key: "partidos", label: "Partidos", icon: MatchesIcon },
  { key: "calendario", label: "Calendario", icon: CalendarIcon },
  { key: "finanzas", label: "Finanzas", icon: FinancesIcon },
  { key: "top", label: "Top", icon: TopIcon },
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
    setAttempts: 0,
  };
}
