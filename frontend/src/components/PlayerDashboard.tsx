import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import { FinanceDebt, FinanceDebtPayment, GlobalStats, MatchRatingRow, PlayerFinanceDebtSummary, PlayerHistoryItem, PlayerItem, PlayerSummary } from '../types';
import { FinanceSection } from './player-dashboard/sections/FinanceSection';
import { ProfileModal } from './player-dashboard/sections/ProfileModal';
import { SectionTabs } from './player-dashboard/sections/SectionTabs';
import { HistorySection } from './player-dashboard/sections/HistorySection';
import { PerformanceSection } from './player-dashboard/sections/PerformanceSection';
import { SummaryCardsSection } from './player-dashboard/sections/SummaryCardsSection';
import { SummarySection } from './player-dashboard/sections/SummarySection';
import { TopSection } from './player-dashboard/sections/TopSection';
import { PlayerDashboardProps, PlayerSectionKey, ProfileFormState } from './player-dashboard/types';
import { buildRadarMetrics, buildSummaryCards, getBestFundament, getWorstFundament } from './player-dashboard/utils';

export function PlayerDashboard({ token }: PlayerDashboardProps) {
  const [activeSection, setActiveSection] = useState<PlayerSectionKey>('resumen');
  const [profile, setProfile] = useState<PlayerItem | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({ fullName: '', password: '' });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [summary, setSummary] = useState<PlayerSummary | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [history, setHistory] = useState<PlayerHistoryItem[]>([]);
  const [topPlayers, setTopPlayers] = useState<PlayerItem[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<PlayerHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchRatings, setMatchRatings] = useState<MatchRatingRow[]>([]);
  const [matchRatingsLoading, setMatchRatingsLoading] = useState(false);
  const [financeSummary, setFinanceSummary] = useState<PlayerFinanceDebtSummary | null>(null);
  const [financeDebts, setFinanceDebts] = useState<FinanceDebt[]>([]);
  const [upcomingDebts, setUpcomingDebts] = useState<FinanceDebt[]>([]);
  const [financePayments, setFinancePayments] = useState<FinanceDebtPayment[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      try {
        const [statsData, profileData, topPlayersData, globalStatsData, debtsData] = await Promise.all([
          api.getMyStats(token),
          api.getMyProfile(token),
          api.getTopPlayers(token),
          api.getGlobalSummary(token),
          api.getMyDebts(token)
        ]);

        setSummary(statsData.summary);
        setGlobalStats(globalStatsData);
        setHistory(statsData.history);
        setTopPlayers(topPlayersData.players);
        setSelectedMatch(statsData.history[0] ?? null);
        setProfile(profileData.player);
        setProfileForm((current) => ({ ...current, fullName: profileData.player.full_name }));
        setFinanceSummary(debtsData.summary);
        setFinanceDebts(debtsData.debts);
        setUpcomingDebts(debtsData.upcomingDebts);
        setFinancePayments(debtsData.payments);
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

      setMatchRatingsLoading(true);

      try {
        const data = await api.getMatchRatings(token, selectedMatch.match_id);
        setMatchRatings(data.ratings.sort((a, b) => b.match_performance - a.match_performance));
      } catch {
        setMatchRatings([]);
      } finally {
        setMatchRatingsLoading(false);
      }
    }

    void fetchMatchRatings();
  }, [selectedMatch, token]);

  const radarMetrics = useMemo(() => buildRadarMetrics(summary), [summary]);

  const bestFundament = useMemo(() => getBestFundament(radarMetrics), [radarMetrics]);

  const worstFundament = useMemo(() => getWorstFundament(radarMetrics), [radarMetrics]);

  const summaryCards = useMemo(
    () => buildSummaryCards(summary, bestFundament, worstFundament),
    [summary, bestFundament, worstFundament]
  );

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFullName = profileForm.fullName.trim();
    const nextPassword = profileForm.password.trim();
    const fullNameChanged = nextFullName.length > 0 && nextFullName !== (profile?.full_name ?? '');

    if (!fullNameChanged && nextPassword.length === 0) {
      toast.error('No hay cambios para guardar en el perfil.');
      return;
    }

    setSavingProfile(true);

    try {
      const response = await api.updateMyProfile(token, {
        fullName: fullNameChanged ? nextFullName : undefined,
        password: nextPassword.length > 0 ? nextPassword : undefined
      });

      setProfile(response.player);
      setSummary((current) => (current ? { ...current, full_name: response.player.full_name } : current));
      setProfileForm({ fullName: response.player.full_name, password: '' });
      toast.success('Perfil actualizado correctamente.');
      setIsProfileModalOpen(false);
    } catch (updateError) {
      toast.error((updateError as Error).message);
    } finally {
      setSavingProfile(false);
    }
  }

  if (loading) {
    return <div className="card">Cargando dashboard de jugador...</div>;
  }

  return (
    <div className="space-y-6">
      <SectionTabs activeSection={activeSection} onSelectSection={setActiveSection} />

      <SummarySection
        active={activeSection === 'resumen'}
        profile={profile}
        summary={summary}
        globalStats={globalStats}
        onOpenProfileModal={() => {
          setProfileForm((current) => ({ ...current, fullName: profile?.full_name ?? current.fullName, password: '' }));
          setIsProfileModalOpen(true);
        }}
      />

      <SummaryCardsSection active={activeSection === 'resumen'} summaryCards={summaryCards} />

      <PerformanceSection active={activeSection === 'rendimiento'} summary={summary} radarMetrics={radarMetrics} />

      <HistorySection
        active={activeSection === 'historial'}
        history={history}
        selectedMatch={selectedMatch}
        matchRatings={matchRatings}
        matchRatingsLoading={matchRatingsLoading}
        onSelectMatch={setSelectedMatch}
      />

      <FinanceSection
        active={activeSection === 'finanzas'}
        summary={financeSummary}
        debts={financeDebts}
        upcomingDebts={upcomingDebts}
        payments={financePayments}
      />

      <TopSection active={activeSection === 'top'} topPlayers={topPlayers} />

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
