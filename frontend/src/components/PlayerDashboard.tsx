import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { api } from "../lib/api";
import {
  CalendarEvent,
  FinanceDebt,
  FinanceDebtPayment,
  GlobalStats,
  MatchRatingRow,
  PlayerFinanceDebtSummary,
  PlayerHistoryItem,
  PlayerItem,
  PlayerSummary,
} from "../types";
import { FinanceSection } from "./player-dashboard/sections/FinanceSection";
import { CalendarSection } from "./player-dashboard/sections/CalendarSection";
import { ProfileModal } from "./player-dashboard/sections/ProfileModal";
import { SectionTabs } from "./player-dashboard/sections/SectionTabs";
import { HistorySection } from "./player-dashboard/sections/HistorySection";
import { PerformanceSection } from "./player-dashboard/sections/PerformanceSection";
import { SummaryCardsSection } from "./player-dashboard/sections/SummaryCardsSection";
import { SummarySection } from "./player-dashboard/sections/SummarySection";
import { TopSection } from "./player-dashboard/sections/TopSection";
import {
  PlayerDashboardProps,
  PlayerSectionKey,
  ProfileFormState,
} from "./player-dashboard/types";
import {
  buildRadarMetrics,
  buildSummaryCards,
  getBestFundament,
} from "./player-dashboard/utils";
import { ProfileSection } from "./player-dashboard/sections/ProfileSection";
import DotLoader from "./loader/DotLoader";

export function PlayerDashboard({ token, onLogout }: PlayerDashboardProps) {
  const [activeSection, setActiveSection] = useState<PlayerSectionKey>(() => {
    const sectionParam = new URLSearchParams(window.location.search).get(
      "section",
    );
    return sectionParam === "calendario" ? "calendario" : "resumen";
  });
  const [profile, setProfile] = useState<PlayerItem | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    fullName: "",
    password: "",
    jerseyNumber: null,
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [summary, setSummary] = useState<PlayerSummary | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [history, setHistory] = useState<PlayerHistoryItem[]>([]);
  const [topPlayers, setTopPlayers] = useState<PlayerItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<PlayerHistoryItem | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [matchRatings, setMatchRatings] = useState<MatchRatingRow[]>([]);
  const [financeSummary, setFinanceSummary] =
    useState<PlayerFinanceDebtSummary | null>(null);
  const [financeDebts, setFinanceDebts] = useState<FinanceDebt[]>([]);
  const [upcomingDebts, setUpcomingDebts] = useState<FinanceDebt[]>([]);
  const [financePayments, setFinancePayments] = useState<FinanceDebtPayment[]>(
    [],
  );
  const [savingAttendanceInstanceId, setSavingAttendanceInstanceId] = useState<
    number | null
  >(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      try {
        const [
          statsData,
          profileData,
          topPlayersData,
          globalStatsData,
          debtsData,
          calendarData,
        ] = await Promise.all([
          api.getMyStats(token),
          api.getMyProfile(token),
          api.getTopPlayers(token),
          api.getGlobalSummary(token),
          api.getMyDebts(token),
          api.getCalendar(token),
        ]);

        setSummary(statsData.summary);
        setGlobalStats(globalStatsData);
        setHistory(statsData.history);
        setTopPlayers(topPlayersData.players);
        setSelectedMatch(statsData.history[0] ?? null);
        setProfile(profileData.player);
        setProfileForm((current) => ({
          ...current,
          fullName: profileData.player.full_name,
          jerseyNumber: profileData.player.jersey_number,
        }));
        setFinanceSummary(debtsData.summary);
        setFinanceDebts(debtsData.debts);
        setUpcomingDebts(debtsData.upcomingDebts);
        setFinancePayments(debtsData.payments);
        setCalendarEvents(calendarData.events);
      } catch (requestError) {
        toast.error((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [token]);

  useEffect(() => {
    async function fetchMatchRatings() {
      if (!selectedMatch) {
        setMatchRatings([]);
        return;
      }

      

      try {
        const data = await api.getMatchRatings(token, selectedMatch.match_id);
        setMatchRatings(
          data.ratings.sort(
            (a, b) => b.match_performance - a.match_performance,
          ),
        );
      } catch {
        setMatchRatings([]);
      } finally {
        // removed matchRatingsLoading toggles per UX change
      }
    }

    void fetchMatchRatings();
  }, [selectedMatch, token]);

  async function handleSubmitAttendance(
    instanceId: number,
    payload: {
      estadoAsistencia: import("../types").AttendanceStatus;
      comentario: string;
    },
  ) {
    setSavingAttendanceInstanceId(instanceId);

    try {
      await api.saveCalendarAttendance(token, instanceId, payload);
      const response = await api.getCalendar(token);
      setCalendarEvents(response.events);
      toast.success("Respuesta de asistencia guardada correctamente.");
    } catch (attendanceError) {
      toast.error((attendanceError as Error).message);
    } finally {
      setSavingAttendanceInstanceId(null);
    }
  }

  const radarMetrics = useMemo(() => buildRadarMetrics(summary), [summary]);

  const bestFundament = useMemo(
    () => getBestFundament(radarMetrics),
    [radarMetrics],
  );

  const summaryCards = useMemo(
    () => buildSummaryCards(summary, bestFundament),
    [summary, bestFundament],
  );

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFullName = profileForm.fullName.trim();
    const nextPassword = profileForm.password.trim();
    const fullNameChanged =
      nextFullName.length > 0 && nextFullName !== (profile?.full_name ?? "");
    const jerseyChanged = profileForm.jerseyNumber !== profile?.jersey_number;

    if (!fullNameChanged && nextPassword.length === 0 && !jerseyChanged) {
      toast.error("No hay cambios para guardar en el perfil.");
      return;
    }

    setSavingProfile(true);

    try {
      const response = await api.updateMyProfile(token, {
        fullName: fullNameChanged ? nextFullName : undefined,
        password: nextPassword.length > 0 ? nextPassword : undefined,
        jerseyNumber: jerseyChanged ? profileForm.jerseyNumber : undefined,
      });

      setProfile(response.player);
      setSummary((current) =>
        current
          ? { ...current, full_name: response.player.full_name }
          : current,
      );
      setProfileForm({
        fullName: response.player.full_name,
        password: "",
        jerseyNumber: response.player.jersey_number,
      });
      toast.success("Perfil actualizado correctamente.");
      setIsProfileModalOpen(false);
    } catch (updateError) {
      toast.error((updateError as Error).message);
    } finally {
      setSavingProfile(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><DotLoader /></div>;
  }

  return (
    <div className="space-y-6 md:ml-72">
      <SectionTabs
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        profile={profile}
        onLogout={onLogout}
      />

      <div className="space-y-6">
        <SummarySection
          active={activeSection === "resumen"}
          globalStats={globalStats}
        />

        <SummaryCardsSection
          active={activeSection === "resumen"}
          summaryCards={summaryCards}
        />

        <PerformanceSection
          active={activeSection === "rendimiento"}
          summary={summary}
          radarMetrics={radarMetrics}
          history={history}
        />

        <ProfileSection
          active={activeSection === "perfil"}
          profile={profile}
          summary={summary}
          onOpenProfileModal={() => {
            setProfileForm((current) => ({
              ...current,
              fullName: profile?.full_name ?? current.fullName,
              password: "",
              jerseyNumber: profile?.jersey_number ?? current.jerseyNumber,
            }));
            setIsProfileModalOpen(true);
          }}
        />
        <HistorySection
          active={activeSection === "historial"}
          history={history}
          selectedMatch={selectedMatch}
          matchRatings={matchRatings}
          onSelectMatch={setSelectedMatch}
        />

        <CalendarSection
          active={activeSection === "calendario"}
          events={calendarEvents}
          savingAttendanceInstanceId={savingAttendanceInstanceId}
          onSubmitAttendance={handleSubmitAttendance}
        />

        <FinanceSection
          active={activeSection === "finanzas"}
          summary={financeSummary}
          debts={financeDebts}
          upcomingDebts={upcomingDebts}
          payments={financePayments}
        />

        <TopSection active={activeSection === "top"} topPlayers={topPlayers} />
      </div>

      <ProfileModal
        open={isProfileModalOpen}
        profileForm={profileForm}
        savingProfile={savingProfile}
        onClose={() => setIsProfileModalOpen(false)}
        onSubmit={handleUpdateProfile}
        onProfileFormChange={(updater) => setProfileForm(updater)}
      />
    </div>
  );
}
