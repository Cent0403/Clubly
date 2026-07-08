import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import {
  AdminUserItem,
  CalendarEvent,
  FinanceCategory,
  FinanceDebt,
  FinanceDebtPayment,
  FinanceOverview,
  FinanceTransaction,
  FinanceType,
  GlobalStats,
  MatchItem,
  MatchRatingRow,
  PlayerHistoryItem,
  PlayerItem,
  PlayerSummary,
  RatingItem,
  Role,
  TeamSettings
} from '../types';
import { EMPTY_EDIT_USER_FORM, EMPTY_MATCH_FORM, EMPTY_USER_FORM, createDefaultRating } from './admin-dashboard/constants';
import { EMPTY_CALENDAR_EVENT_FORM } from './admin-dashboard/constants';
import { DashboardSection } from './admin-dashboard/sections/DashboardSection';
import { CalendarSection } from './admin-dashboard/sections/CalendarSection';
import { FinanceSection } from './admin-dashboard/sections/FinanceSection';
import { MatchesSection } from './admin-dashboard/sections/MatchesSection';
import { SectionTabs } from './admin-dashboard/sections/SectionTabs';
import { TeamSettingsSection } from './admin-dashboard/sections/TeamSettingsSection';
import { TopSection } from './admin-dashboard/sections/TopSection';
import { UsersSection } from './admin-dashboard/sections/UsersSection';
import { AdminDashboardProps, AdminSectionKey, CalendarEventFormState, EditUserFormState, MatchFormState, UserFormState } from './admin-dashboard/types';
import { mapMatchRatingRowToRating } from './admin-dashboard/utils';

export function AdminDashboard({ token, teamSettings, onTeamSettingsUpdated, onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<AdminSectionKey>(() => {
    const sectionParam = new URLSearchParams(window.location.search).get('section');
    return sectionParam === 'calendario' ? 'calendario' : 'dashboard';
  });
  const today = new Date().toISOString().slice(0, 10);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | Role>('ALL');
  const [players, setPlayers] = useState<PlayerItem[]>([]);
  const [topPlayers, setTopPlayers] = useState<PlayerItem[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [evaluationPlayerSearchTerm, setEvaluationPlayerSearchTerm] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [ratings, setRatings] = useState<Record<number, RatingItem>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matchForm, setMatchForm] = useState<MatchFormState>(EMPTY_MATCH_FORM);
  const [userForm, setUserForm] = useState<UserFormState>(EMPTY_USER_FORM);
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [loadingMatchRatings, setLoadingMatchRatings] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingUserForm, setEditingUserForm] = useState<EditUserFormState>(EMPTY_EDIT_USER_FORM);
  const [savingUserEdit, setSavingUserEdit] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [selectedPlayerStatId, setSelectedPlayerStatId] = useState<number | null>(null);
  const [selectedPlayerSummary, setSelectedPlayerSummary] = useState<PlayerSummary | null>(null);
  const [selectedPlayerHistory, setSelectedPlayerHistory] = useState<PlayerHistoryItem[]>([]);
  const [loadingPlayerStats, setLoadingPlayerStats] = useState(false);
  const [settingsForm, setSettingsForm] = useState<TeamSettings>(teamSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [financeOverview, setFinanceOverview] = useState<FinanceOverview | null>(null);
  const [financeCategories, setFinanceCategories] = useState<FinanceCategory[]>([]);
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([]);
  const [financeDebts, setFinanceDebts] = useState<FinanceDebt[]>([]);
  const [financeDebtPayments, setFinanceDebtPayments] = useState<FinanceDebtPayment[]>([]);
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<FinanceType>('income');
  const [transactionType, setTransactionType] = useState<FinanceType>('expense');
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const [transactionCategoryId, setTransactionCategoryId] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(today);
  const [debtPlayerId, setDebtPlayerId] = useState('');
  const [editingDebtId, setEditingDebtId] = useState<number | null>(null);
  const [debtAmountDue, setDebtAmountDue] = useState('');
  const [debtDescription, setDebtDescription] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [debtPaymentAmount, setDebtPaymentAmount] = useState<Record<number, string>>({});
  const [debtPaymentDate, setDebtPaymentDate] = useState<Record<number, string>>({});
  const [calendarForm, setCalendarForm] = useState<CalendarEventFormState>(EMPTY_CALENDAR_EVENT_FORM);
  const [savingCalendarEvent, setSavingCalendarEvent] = useState(false);
  const [editingCalendarInstanceId, setEditingCalendarInstanceId] = useState<number | null>(null);

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId) ?? null,
    [matches, selectedMatchId]
  );

  const filteredUsers = useMemo(() => {
    const search = userSearchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const roleMatches = userRoleFilter === 'ALL' || user.role === userRoleFilter;

      if (!roleMatches) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        user.full_name.toLowerCase().includes(search) ||
        user.username.toLowerCase().includes(search) ||
        (user.position ?? '').toLowerCase().includes(search)
      );
    });
  }, [users, userRoleFilter, userSearchTerm]);

  const filteredEvaluationPlayers = useMemo(() => {
    const search = evaluationPlayerSearchTerm.trim().toLowerCase();

    if (!search) {
      return players;
    }

    return players.filter((player) => {
      return (
        player.full_name.toLowerCase().includes(search) ||
        player.username.toLowerCase().includes(search) ||
        (player.position ?? '').toLowerCase().includes(search) ||
        String(player.jersey_number ?? '').includes(search)
      );
    });
  }, [evaluationPlayerSearchTerm, players]);

  async function loadInitialData() {
    setLoading(true);

    try {
      const [usersRes, playersRes, topPlayersRes, matchesRes, calendarRes, statsRes, financeOverviewRes, categoriesRes, transactionsRes, debtsRes] = await Promise.all([
        api.getUsers(token),
        api.getPlayers(token),
        api.getTopPlayers(token),
        api.getMatches(token),
        api.getCalendar(token),
        api.getGlobalStats(token),
        api.getFinanceOverview(token),
        api.getFinanceCategories(token),
        api.getFinanceTransactions(token),
        api.getPlayerDebts(token)
      ]);

      setUsers(usersRes.users);
      setPlayers(playersRes.players);
      setTopPlayers(topPlayersRes.players);
      setMatches(matchesRes.matches);
      setCalendarEvents(calendarRes.events);
      setGlobalStats(statsRes);
      setFinanceOverview(financeOverviewRes);
      setFinanceCategories(categoriesRes.categories);
      setFinanceTransactions(transactionsRes.transactions);
      setFinanceDebts(debtsRes.debts);
      setFinanceDebtPayments(debtsRes.payments);

      if (matchesRes.matches.length > 0 && !selectedMatchId) {
        setSelectedMatchId(matchesRes.matches[0].id);
      }
    } catch (loadError) {
      toast.error((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    setSettingsForm(teamSettings);
  }, [teamSettings]);

  async function refreshTopPlayers() {
    const response = await api.getTopPlayers(token);
    setTopPlayers(response.players);
  }

  async function loadFinanceData() {
    const [overviewRes, categoriesRes, transactionsRes, debtsRes] = await Promise.all([
      api.getFinanceOverview(token),
      api.getFinanceCategories(token),
      api.getFinanceTransactions(token),
      api.getPlayerDebts(token)
    ]);

    setFinanceOverview(overviewRes);
    setFinanceCategories(categoriesRes.categories);
    setFinanceTransactions(transactionsRes.transactions);
    setFinanceDebts(debtsRes.debts);
    setFinanceDebtPayments(debtsRes.payments);
  }

  async function loadCalendarData() {
    const response = await api.getCalendar(token);
    setCalendarEvents(response.events);
  }

  useEffect(() => {
    if (!selectedPlayerStatId && players.length > 0) {
      setSelectedPlayerStatId(players[0].player_id);
    }
  }, [players, selectedPlayerStatId]);

  useEffect(() => {
    async function loadSelectedMatchRatings(matchId: number) {
      setLoadingMatchRatings(true);

      try {
        const response = await api.getMatchRatings(token, matchId);

        if (response.ratings.length === 0) {
          setSelectedPlayers([]);
          setRatings({});
          return;
        }

        const nextSelectedPlayers: number[] = [];
        const nextRatings: Record<number, RatingItem> = {};

        response.ratings.forEach((row: MatchRatingRow) => {
          nextSelectedPlayers.push(row.player_id);
          nextRatings[row.player_id] = mapMatchRatingRowToRating(row);
        });

        setSelectedPlayers([]);
        setRatings(nextRatings);
      } catch {
        setSelectedPlayers([]);
        setRatings({});
      } finally {
        setLoadingMatchRatings(false);
      }
    }

    if (!selectedMatchId) {
      setSelectedPlayers([]);
      setRatings({});
      return;
    }

    void loadSelectedMatchRatings(selectedMatchId);
  }, [selectedMatchId, token]);

  function togglePlayer(playerId: number) {
    setSelectedPlayers((current) =>
      current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId]
    );

    setRatings((current) => {
      if (current[playerId]) {
        return current;
      }

      return {
        ...current,
        [playerId]: createDefaultRating(playerId)
      };
    });
  }

  function updateEventCount(playerId: number, field: keyof Omit<RatingItem, 'playerId' | 'minutesPlayed'>, value: number) {
    const sanitizedValue = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));

    setRatings((current) => {
      const nextRating = {
        ...(current[playerId] ?? createDefaultRating(playerId)),
        [field]: sanitizedValue
      } as RatingItem;

      nextRating.attackAttempts = Math.max(nextRating.attackAttempts, nextRating.attackPoints + nextRating.attackErrors);
      nextRating.serveAttempts = Math.max(nextRating.serveAttempts, nextRating.serveAces + nextRating.serveErrors);
      nextRating.setAttempts = Math.max(nextRating.setAttempts, nextRating.setAssists + nextRating.setErrors);

      return {
        ...current,
        [playerId]: nextRating
      };
    });
  }

  function updateMinutesPlayed(playerId: number, value: boolean) {
    setRatings((current) => ({
      ...current,
      [playerId]: {
        ...(current[playerId] ?? createDefaultRating(playerId)),
        minutesPlayed: value
      }
    }));
  }

  function loadUserIntoEditForm(user: AdminUserItem) {
    setEditingUserId(user.id);
    setEditingUserForm({
      username: user.username,
      password: '',
      fullName: user.full_name,
      role: user.role,
      jerseyNumber: user.jersey_number === null ? '' : String(user.jersey_number),
      position: (user.position as EditUserFormState['position']) ?? ''
    });
    toast(`Editando usuario: ${user.full_name}`);
  }

  async function handleUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingUserId) {
      toast.error('Selecciona un usuario para editar.');
      return;
    }

    if (!editingUserForm.username.trim() || !editingUserForm.fullName.trim()) {
      toast.error('Username y nombre completo son obligatorios.');
      return;
    }

    setSavingUserEdit(true);

    try {
      const payload = {
        username: editingUserForm.username.trim(),
        fullName: editingUserForm.fullName.trim(),
        role: editingUserForm.role,
        ...(editingUserForm.password.trim() ? { password: editingUserForm.password.trim() } : {}),
        ...(editingUserForm.role === 'PLAYER'
          ? {
              jerseyNumber: editingUserForm.jerseyNumber ? Number(editingUserForm.jerseyNumber) : null,
              position: editingUserForm.position || null
            }
          : {})
      };

      const response = await api.updateUser(token, editingUserId, payload);

      setUsers((current) => current.map((user) => (user.id === editingUserId ? response.user : user)));

      const playersRes = await api.getPlayers(token);
      setPlayers(playersRes.players);
      await refreshTopPlayers();

      if (selectedPlayerStatId && !playersRes.players.some((player) => player.player_id === selectedPlayerStatId)) {
        setSelectedPlayerStatId(null);
        setSelectedPlayerSummary(null);
        setSelectedPlayerHistory([]);
      }

      setEditingUserForm((current) => ({ ...current, password: '' }));
      toast.success('Usuario actualizado correctamente.');
    } catch (updateUserError) {
      toast.error((updateUserError as Error).message);
    } finally {
      setSavingUserEdit(false);
    }
  }

  async function handleDeleteUser(user: AdminUserItem) {
    const confirmDelete = window.confirm(
      `Esta accion eliminara el usuario ${user.full_name}${user.role === 'PLAYER' ? ' y su perfil de jugador' : ''}.`
    );

    if (!confirmDelete) {
      return;
    }

    setDeletingUserId(user.id);

    try {
      await api.deleteUser(token, user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));

      if (user.player_id) {
        setPlayers((current) => current.filter((player) => player.player_id !== user.player_id));
        setSelectedPlayers((current) => current.filter((playerId) => playerId !== user.player_id));
        setRatings((current) => {
          const next = { ...current };
          delete next[user.player_id as number];
          return next;
        });

        if (selectedPlayerStatId === user.player_id) {
          setSelectedPlayerStatId(null);
          setSelectedPlayerSummary(null);
          setSelectedPlayerHistory([]);
        }
      }

      await refreshTopPlayers();

      if (editingUserId === user.id) {
        setEditingUserId(null);
        setEditingUserForm(EMPTY_EDIT_USER_FORM);
      }

      toast.success('Usuario eliminado correctamente.');
    } catch (deleteUserError) {
      toast.error((deleteUserError as Error).message);
    } finally {
      setDeletingUserId(null);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userForm.username || !userForm.password || !userForm.fullName) {
      toast.error('Completa username, password y nombre completo para crear usuario.');
      return;
    }

    setCreatingUser(true);

    try {
      const response = await api.createUser(token, {
        username: userForm.username.trim(),
        password: userForm.password,
        fullName: userForm.fullName.trim(),
        role: userForm.role,
        jerseyNumber:
          userForm.role === 'PLAYER' && userForm.jerseyNumber
            ? Number(userForm.jerseyNumber)
            : undefined,
        position: userForm.role === 'PLAYER' && userForm.position ? userForm.position : undefined
      });

      setUserForm(EMPTY_USER_FORM);

      setUsers((current) => [
        ...current,
        {
          id: response.user.id,
          username: response.user.username,
          full_name: response.user.fullName,
          role: response.user.role,
          player_id: response.user.playerId,
          jersey_number: userForm.role === 'PLAYER' && userForm.jerseyNumber ? Number(userForm.jerseyNumber) : null,
          position: userForm.role === 'PLAYER' ? userForm.position || null : null
        }
      ]);

      if (response.user.role === 'PLAYER' && response.user.playerId) {
        setPlayers((current) => [
          ...current,
          {
            player_id: response.user.playerId as number,
            user_id: response.user.id,
            username: response.user.username,
            full_name: response.user.fullName,
            jersey_number: userForm.jerseyNumber ? Number(userForm.jerseyNumber) : null,
            position: userForm.position || null,
            overall_score: 0
          }
        ]);
      }

      if (response.user.role === 'PLAYER' && response.user.playerId) {
        setSelectedPlayerStatId(response.user.playerId);
        const playerStats = await api.getPlayerStats(token, response.user.playerId);
        setSelectedPlayerSummary(playerStats.summary);
        setSelectedPlayerHistory(playerStats.history);
      }

      await refreshTopPlayers();
      toast.success('Usuario creado correctamente.');
    } catch (createUserError) {
      toast.error((createUserError as Error).message);
    } finally {
      setCreatingUser(false);
    }
  }

  async function handleLoadPlayerStats() {
    if (!selectedPlayerStatId) {
      toast.error('Selecciona un jugador para consultar estadisticas.');
      return;
    }

    setLoadingPlayerStats(true);

    try {
      const response = await api.getPlayerStats(token, selectedPlayerStatId);
      setSelectedPlayerSummary(response.summary);
      setSelectedPlayerHistory(response.history);
    } catch (playerStatsError) {
      toast.error((playerStatsError as Error).message);
    } finally {
      setLoadingPlayerStats(false);
    }
  }

  async function handleCreateMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await api.createMatch(token, {
        ...matchForm,
        location: matchForm.location || undefined,
        notes: matchForm.notes || undefined
      });

      toast.success(`Partido creado (#${response.id})`);
      setMatchForm(EMPTY_MATCH_FORM);
      setMatches((current) => [
        {
          id: response.id,
          match_date: matchForm.matchDate,
          opponent: matchForm.opponent,
          tournament: matchForm.tournament,
          location: matchForm.location || null,
          notes: matchForm.notes || null,
          participant_count: 0
        },
        ...current
      ]);
      setSelectedMatchId(response.id);
    } catch (createError) {
      toast.error((createError as Error).message);
    }
  }

  async function handleUpdateMatch() {
    if (!editingMatchId) {
      toast.error('Primero carga un partido en el formulario para editar.');
      return;
    }

    try {
      await api.updateMatch(token, editingMatchId, {
        ...matchForm,
        location: matchForm.location || undefined,
        notes: matchForm.notes || undefined
      });

      toast.success('Partido actualizado correctamente.');
      setMatches((current) =>
        current.map((match) =>
          match.id === editingMatchId
            ? {
                ...match,
                match_date: matchForm.matchDate,
                opponent: matchForm.opponent,
                tournament: matchForm.tournament,
                location: matchForm.location || null,
                notes: matchForm.notes || null
              }
            : match
        )
      );
    } catch (updateError) {
      toast.error((updateError as Error).message);
    }
  }

  function handleLoadMatchForEdit() {
    if (!selectedMatch) {
      toast.error('Selecciona un partido para editar.');
      return;
    }

    setEditingMatchId(selectedMatch.id);
    setMatchForm({
      matchDate: selectedMatch.match_date,
      opponent: selectedMatch.opponent,
      tournament: selectedMatch.tournament,
      location: selectedMatch.location ?? '',
      notes: selectedMatch.notes ?? ''
    });
    toast(`Editando partido #${selectedMatch.id}`);
  }

  async function handleDeleteMatch() {
    if (!selectedMatchId) {
      toast.error('Selecciona un partido para eliminar.');
      return;
    }

    const confirmDelete = window.confirm('Esta accion eliminara el partido, participantes y calificaciones asociadas.');
    if (!confirmDelete) {
      return;
    }

    try {
      await api.deleteMatch(token, selectedMatchId);
      toast.success('Partido eliminado correctamente.');
      setEditingMatchId(null);
      setMatchForm(EMPTY_MATCH_FORM);
      setSelectedMatchId(null);
      setSelectedPlayers([]);
      setRatings({});
      setMatches((current) => current.filter((match) => match.id !== selectedMatchId));
    } catch (deleteError) {
      toast.error((deleteError as Error).message);
    }
  }

  async function handleSaveEvaluation() {
    if (!selectedMatchId) {
      toast.error('Selecciona un partido antes de guardar la evaluacion.');
      return;
    }

    if (selectedPlayers.length === 0) {
      toast.error('Selecciona al menos un jugador.');
      return;
    }

    setSaving(true);

    try {
      await api.assignPlayers(token, selectedMatchId, selectedPlayers);

      const payload = selectedPlayers
        .map((playerId) => ratings[playerId])
        .filter(Boolean) as RatingItem[];

      await api.saveRatings(token, selectedMatchId, payload);
      toast.success('Participantes y evaluacion por eventos guardados correctamente.');

      const [matchRatings, updatedStats] = await Promise.all([
        api.getMatchRatings(token, selectedMatchId),
        api.getGlobalStats(token)
      ]);

      setGlobalStats(updatedStats);
      await refreshTopPlayers();

      const nextSelectedPlayers = matchRatings.ratings.map((row) => row.player_id);
      const nextRatings: Record<number, RatingItem> = {};

      matchRatings.ratings.forEach((row) => {
        nextRatings[row.player_id] = mapMatchRatingRowToRating(row);
      });

      setSelectedPlayers(nextSelectedPlayers);
      setRatings(nextRatings);

      if (selectedPlayerStatId) {
        const playerStats = await api.getPlayerStats(token, selectedPlayerStatId);
        setSelectedPlayerSummary(playerStats.summary);
        setSelectedPlayerHistory(playerStats.history);
      }
    } catch (saveError) {
      toast.error((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTeamSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextName = settingsForm.teamName.trim();
    if (!nextName) {
      toast.error('El nombre del equipo no puede estar vacio.');
      return;
    }

    setSavingSettings(true);

    try {
      const response = await api.updateTeamSettings(token, {
        teamName: nextName,
        teamLogoUrl: settingsForm.teamLogoUrl
      });

      onTeamSettingsUpdated(response.settings);
      setSettingsForm(response.settings);
      toast.success('Personalizacion del equipo guardada correctamente.');
    } catch (updateError) {
      toast.error((updateError as Error).message);
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleCreateFinanceCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextCategoryName = categoryName.trim();
    if (!nextCategoryName) {
      toast.error('El nombre de la categoria es obligatorio.');
      return;
    }

    setLoadingFinance(true);

    try {
      if (editingCategoryId) {
        await api.updateFinanceCategory(token, editingCategoryId, { name: nextCategoryName, type: categoryType });
      } else {
        await api.createFinanceCategory(token, { name: nextCategoryName, type: categoryType });
      }

      await loadFinanceData();
      setEditingCategoryId(null);
      setCategoryName('');
      toast.success(editingCategoryId ? 'Categoría actualizada correctamente.' : 'Categoria financiera creada correctamente.');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoadingFinance(false);
    }
  }

  function handleEditCategory(categoryId: number) {
    const category = financeCategories.find((item) => item.id === categoryId);

    if (!category) {
      toast.error('No se encontró la categoría a editar.');
      return;
    }

    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryType(category.type);
    toast('Editando categoría financiera.');
  }

  function handleCancelEditCategory() {
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryType('income');
  }

  async function handleCreateFinanceTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amount = Number(transactionAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Ingresa un monto valido mayor a 0 para el movimiento.');
      return;
    }

    if (!transactionDate) {
      toast.error('Selecciona una fecha para el movimiento.');
      return;
    }

    setLoadingFinance(true);

    try {
      if (editingTransactionId) {
        await api.updateFinanceTransaction(token, editingTransactionId, {
          categoryId: transactionCategoryId ? Number(transactionCategoryId) : null,
          amount,
          type: transactionType,
          description: transactionDescription.trim() || undefined,
          transactionDate
        });
      } else {
        await api.createFinanceTransaction(token, {
          categoryId: transactionCategoryId ? Number(transactionCategoryId) : null,
          amount,
          type: transactionType,
          description: transactionDescription.trim() || undefined,
          transactionDate
        });
      }

      await loadFinanceData();
      setEditingTransactionId(null);
      setTransactionAmount('');
      setTransactionDescription('');
      setTransactionCategoryId('');
      setTransactionDate(today);
      toast.success(editingTransactionId ? 'Movimiento actualizado correctamente.' : 'Movimiento financiero registrado correctamente.');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoadingFinance(false);
    }
  }

  function handleEditTransaction(transactionId: number) {
    const transaction = financeTransactions.find((item) => item.id === transactionId);

    if (!transaction) {
      toast.error('No se encontró el movimiento a editar.');
      return;
    }

    setEditingTransactionId(transaction.id);
    setTransactionType(transaction.type);
    setTransactionCategoryId(transaction.category_id ? String(transaction.category_id) : '');
    setTransactionAmount(String(transaction.amount));
    setTransactionDescription(transaction.description ?? '');
    setTransactionDate(transaction.transaction_date || today);
    toast('Editando movimiento financiero.');
  }

  function handleCancelEditTransaction() {
    setEditingTransactionId(null);
    setTransactionType('expense');
    setTransactionCategoryId('');
    setTransactionAmount('');
    setTransactionDescription('');
    setTransactionDate(today);
  }

  async function handleCreateDebt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const playerId = Number(debtPlayerId);
    const amountDue = Number(debtAmountDue);

    if (!Number.isInteger(playerId) || playerId <= 0) {
      toast.error('Selecciona un jugador para registrar la deuda.');
      return;
    }

    if (!Number.isFinite(amountDue) || amountDue <= 0) {
      toast.error('Ingresa un monto de deuda valido mayor a 0.');
      return;
    }

    setLoadingFinance(true);

    try {
      if (editingDebtId) {
        await api.updatePlayerDebt(token, editingDebtId, {
          amountDue,
          description: debtDescription.trim() || null,
          dueDate: debtDueDate || null
        });
      } else {
        await api.createPlayerDebt(token, {
          playerId,
          amountDue,
          description: debtDescription.trim() || undefined,
          dueDate: debtDueDate || undefined
        });
      }

      await loadFinanceData();
      setEditingDebtId(null);
      setDebtPlayerId('');
      setDebtAmountDue('');
      setDebtDescription('');
      setDebtDueDate('');
      toast.success(editingDebtId ? 'Deuda actualizada correctamente.' : 'Deuda registrada correctamente.');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoadingFinance(false);
    }
  }

  function handleEditDebt(debtId: number) {
    const debt = financeDebts.find((item) => item.id === debtId);

    if (!debt) {
      toast.error('No se encontró la deuda a editar.');
      return;
    }

    setEditingDebtId(debt.id);
    setDebtPlayerId(String(debt.player_id));
    setDebtAmountDue(String(debt.amount_due));
    setDebtDescription(debt.description ?? '');
    setDebtDueDate(debt.due_date ?? '');
    toast('Editando deuda del jugador.');
  }

  function handleCancelEditDebt() {
    setEditingDebtId(null);
    setDebtPlayerId('');
    setDebtAmountDue('');
    setDebtDescription('');
    setDebtDueDate('');
  }

  async function handleCreateDebtPayment(debtId: number) {
    const amount = Number(debtPaymentAmount[debtId] ?? '');
    const paymentDate = debtPaymentDate[debtId] || '';

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Ingresa un monto de pago valido mayor a 0.');
      return;
    }

    if (!paymentDate) {
      toast.error('Selecciona la fecha del pago.');
      return;
    }

    setLoadingFinance(true);

    try {
      await api.createPlayerDebtPayment(token, debtId, {
        amountPaid: amount,
        paymentDate
      });

      await loadFinanceData();
      setDebtPaymentAmount((current) => ({ ...current, [debtId]: '' }));
      setDebtPaymentDate((current) => ({ ...current, [debtId]: '' }));
      toast.success('Pago registrado correctamente.');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoadingFinance(false);
    }
  }

  async function handleCreateCalendarEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const titulo = calendarForm.titulo.trim();
    const fechaHoraInicio = calendarForm.fechaHoraInicio.trim();
    const fechaHoraFin = calendarForm.fechaHoraFin.trim();

    if (!titulo || !fechaHoraInicio || !fechaHoraFin) {
      toast.error('Completa título, inicio y fin para crear el evento.');
      return;
    }

    if (titulo.length > 80) {
      toast.error('El título no puede superar los 80 caracteres.');
      return;
    }

    if (calendarForm.descripcion.trim().length > 500) {
      toast.error('La descripción no puede superar los 500 caracteres.');
      return;
    }

    if (calendarForm.lugar.trim().length > 100) {
      toast.error('El lugar no puede superar los 100 caracteres.');
      return;
    }

    const startDate = new Date(fechaHoraInicio);
    const endDate = new Date(fechaHoraFin);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      toast.error('Las fechas de inicio y fin deben ser válidas.');
      return;
    }

    if (endDate <= startDate) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    if (calendarForm.esRepetitivo && !calendarForm.fechaFinSerie) {
      toast.error('Indica la fecha fin de serie para eventos repetitivos.');
      return;
    }

    if (calendarForm.esRepetitivo && !calendarForm.frecuenciaRepeticion) {
      toast.error('Selecciona una frecuencia para el evento repetitivo.');
      return;
    }

    if (calendarForm.esRepetitivo) {
      const endRepeatDate = new Date(calendarForm.fechaFinSerie);

      if (Number.isNaN(endRepeatDate.getTime())) {
        toast.error('La fecha fin de serie no es válida.');
        return;
      }

      if (endRepeatDate <= startDate) {
        toast.error('La fecha fin de serie debe ser posterior a la fecha de inicio.');
        return;
      }
    }

    setSavingCalendarEvent(true);

    try {
      const payload = {
        titulo,
        descripcion: calendarForm.descripcion.trim() || undefined,
        tipoEvento: calendarForm.tipoEvento,
        esRepetitivo: calendarForm.esRepetitivo,
        frecuenciaRepeticion: calendarForm.esRepetitivo ? calendarForm.frecuenciaRepeticion || null : null,
        fechaHoraInicio,
        fechaHoraFin,
        fechaFinSerie: calendarForm.esRepetitivo ? calendarForm.fechaFinSerie || null : null,
        requiereAsistencia: calendarForm.requiereAsistencia,
        lugar: calendarForm.lugar.trim() || null
      };

      if (editingCalendarInstanceId) {
        await api.updateCalendarEvent(token, editingCalendarInstanceId, {
          ...payload,
          estadoInstancia: 'programado'
        });
        toast.success('Evento actualizado correctamente.');
      } else {
        const response = await api.createCalendarEvent(token, payload);
        toast.success(`Evento creado (${response.instancesCreated} instancia${response.instancesCreated === 1 ? '' : 's'}).`);
      }

      setCalendarForm(EMPTY_CALENDAR_EVENT_FORM);
      setEditingCalendarInstanceId(null);
      await loadCalendarData();
    } catch (createError) {
      toast.error((createError as Error).message);
    } finally {
      setSavingCalendarEvent(false);
    }
  }

  function handleEditCalendarEvent(event: CalendarEvent, instanceId: number) {
    const instance = event.instances.find((item) => item.id === instanceId);

    if (!instance) {
      toast.error('No se encontró la instancia para editar.');
      return;
    }

    setEditingCalendarInstanceId(instance.id);
    setCalendarForm({
      titulo: event.titulo,
      descripcion: event.descripcion ?? '',
      tipoEvento: event.tipo_evento,
      esRepetitivo: event.es_repetitivo,
      frecuenciaRepeticion: event.frecuencia_repeticion ?? 'semanal',
      fechaHoraInicio: instance.fecha_hora_inicio,
      fechaHoraFin: instance.fecha_hora_fin,
      fechaFinSerie: event.fecha_fin_serie ?? '',
      requiereAsistencia: instance.requiere_asistencia,
      lugar: instance.lugar ?? ''
    });

    toast(`Editando instancia #${instance.id}. Los datos de repetición quedan bloqueados en modo edición.`);
  }

  function handleCancelEditCalendarEvent() {
    setEditingCalendarInstanceId(null);
    setCalendarForm(EMPTY_CALENDAR_EVENT_FORM);
    toast.success('Edición cancelada.');
  }

  async function handleDeleteCalendarEvent(event: CalendarEvent, instanceId: number) {
    const instance = event.instances.find((item) => item.id === instanceId);

    if (!instance) {
      toast.error('No se encontró la instancia para eliminar.');
      return;
    }

    const confirmed = window.confirm(`¿Eliminar la instancia de "${event.titulo}"? Esta acción no se puede deshacer.`);

    if (!confirmed) {
      return;
    }

    setSavingCalendarEvent(true);

    try {
      await api.deleteCalendarEvent(token, instanceId);

      if (editingCalendarInstanceId === instanceId) {
        setEditingCalendarInstanceId(null);
        setCalendarForm(EMPTY_CALENDAR_EVENT_FORM);
      }

      await loadCalendarData();
      toast.success('Evento eliminado correctamente.');
    } catch (deleteError) {
      toast.error((deleteError as Error).message);
    } finally {
      setSavingCalendarEvent(false);
    }
  }

  function handleTeamLogoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (result) {
        setSettingsForm((current) => ({ ...current, teamLogoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  }

  if (loading) {
    return <div className="card">Cargando panel administrador...</div>;
  }

  return (
    <div className="space-y-6 md:ml-72">
      <SectionTabs activeSection={activeSection} onSelectSection={setActiveSection} teamSettings={teamSettings} onLogout={onLogout} />
      <div className="space-y-6">
      <DashboardSection active={activeSection === 'dashboard'} globalStats={globalStats} />
        <TeamSettingsSection
          active={activeSection === 'personalización'}
          settingsForm={settingsForm}
          savingSettings={savingSettings}
          onSettingsFormChange={(updater) => setSettingsForm(updater)}
          onSaveTeamSettings={handleSaveTeamSettings}
          onTeamLogoFileChange={handleTeamLogoFileChange}
        />

        <UsersSection
        active={activeSection === 'usuarios'}
        userForm={userForm}
        creatingUser={creatingUser}
        onUserFormChange={(updater) => setUserForm(updater)}
        onCreateUser={handleCreateUser}
        selectedPlayerStatId={selectedPlayerStatId}
        players={players}
        loadingPlayerStats={loadingPlayerStats}
        selectedPlayerSummary={selectedPlayerSummary}
        selectedPlayerHistory={selectedPlayerHistory}
        onSelectedPlayerStatChange={setSelectedPlayerStatId}
        onLoadPlayerStats={handleLoadPlayerStats}
        editingUserId={editingUserId}
        editingUserForm={editingUserForm}
        savingUserEdit={savingUserEdit}
        users={users}
        filteredUsers={filteredUsers}
        userSearchTerm={userSearchTerm}
        userRoleFilter={userRoleFilter}
        deletingUserId={deletingUserId}
        onEditingUserFormChange={(updater) => setEditingUserForm(updater)}
        onUpdateUser={handleUpdateUser}
        onCancelEditUser={() => {
          setEditingUserId(null);
          setEditingUserForm(EMPTY_EDIT_USER_FORM);
        }}
        onUserSearchTermChange={setUserSearchTerm}
        onUserRoleFilterChange={setUserRoleFilter}
        onLoadUserIntoEditForm={loadUserIntoEditForm}
        onDeleteUser={(user) => {
          void handleDeleteUser(user);
        }}
      />

      <MatchesSection
        active={activeSection === 'partidos'}
        editingMatchId={editingMatchId}
        matchForm={matchForm}
        selectedMatchId={selectedMatchId}
        selectedMatch={selectedMatch}
        matches={matches}
        players={players}
        filteredEvaluationPlayers={filteredEvaluationPlayers}
        evaluationPlayerSearchTerm={evaluationPlayerSearchTerm}
        selectedPlayers={selectedPlayers}
        ratings={ratings}
        loadingMatchRatings={loadingMatchRatings}
        saving={saving}
        onMatchFormChange={(updater) => setMatchForm(updater)}
        onCreateMatch={handleCreateMatch}
        onUpdateMatch={handleUpdateMatch}
        onClearMatchForm={() => {
          setEditingMatchId(null);
          setMatchForm(EMPTY_MATCH_FORM);
        }}
        onSelectedMatchChange={setSelectedMatchId}
        onEvaluationPlayerSearchTermChange={setEvaluationPlayerSearchTerm}
        onTogglePlayer={togglePlayer}
        onUpdateMinutesPlayed={updateMinutesPlayed}
        onUpdateEventCount={updateEventCount}
        onSaveEvaluation={() => {
          void handleSaveEvaluation();
        }}
        onLoadMatchForEdit={handleLoadMatchForEdit}
        onDeleteMatch={() => {
          void handleDeleteMatch();
        }}
        onClearSelection={() => {
          setSelectedPlayers([]);
          setRatings({});
        }}
      />

      <CalendarSection
        active={activeSection === 'calendario'}
        events={calendarEvents}
        calendarForm={calendarForm}
        editingCalendarInstanceId={editingCalendarInstanceId}
        savingCalendarEvent={savingCalendarEvent}
        onCalendarFormChange={(updater) => setCalendarForm(updater)}
        onCreateCalendarEvent={handleCreateCalendarEvent}
        onEditCalendarEvent={handleEditCalendarEvent}
        onDeleteCalendarEvent={handleDeleteCalendarEvent}
        onCancelEditCalendarEvent={handleCancelEditCalendarEvent}
      />

      <FinanceSection
        active={activeSection === 'finanzas'}
        loadingFinance={loadingFinance}
        editingCategoryId={editingCategoryId}
        editingTransactionId={editingTransactionId}
        editingDebtId={editingDebtId}
        overview={financeOverview}
        categories={financeCategories}
        transactions={financeTransactions}
        debts={financeDebts}
        debtPayments={financeDebtPayments}
        players={players}
        categoryName={categoryName}
        categoryType={categoryType}
        transactionType={transactionType}
        transactionCategoryId={transactionCategoryId}
        transactionAmount={transactionAmount}
        transactionDescription={transactionDescription}
        transactionDate={transactionDate}
        debtPlayerId={debtPlayerId}
        debtAmountDue={debtAmountDue}
        debtDescription={debtDescription}
        debtDueDate={debtDueDate}
        debtPaymentAmount={debtPaymentAmount}
        debtPaymentDate={debtPaymentDate}
        onCategoryNameChange={setCategoryName}
        onCategoryTypeChange={setCategoryType}
        onCreateCategory={handleCreateFinanceCategory}
        onEditCategory={handleEditCategory}
        onCancelEditCategory={handleCancelEditCategory}
        onTransactionTypeChange={setTransactionType}
        onTransactionCategoryIdChange={setTransactionCategoryId}
        onTransactionAmountChange={setTransactionAmount}
        onTransactionDescriptionChange={setTransactionDescription}
        onTransactionDateChange={setTransactionDate}
        onCreateTransaction={handleCreateFinanceTransaction}
        onEditTransaction={handleEditTransaction}
        onCancelEditTransaction={handleCancelEditTransaction}
        onDebtPlayerIdChange={setDebtPlayerId}
        onDebtAmountDueChange={setDebtAmountDue}
        onDebtDescriptionChange={setDebtDescription}
        onDebtDueDateChange={setDebtDueDate}
        onCreateDebt={handleCreateDebt}
        onEditDebt={handleEditDebt}
        onCancelEditDebt={handleCancelEditDebt}
        onDebtPaymentAmountChange={(debtId, value) => {
          setDebtPaymentAmount((current) => ({ ...current, [debtId]: value }));
        }}
        onDebtPaymentDateChange={(debtId, value) => {
          setDebtPaymentDate((current) => ({ ...current, [debtId]: value }));
        }}
        onCreateDebtPayment={(debtId) => {
          void handleCreateDebtPayment(debtId);
        }}
      />

      <TopSection active={activeSection === 'top'} topPlayers={topPlayers} />
      </div>
    </div>
  );
}

export default AdminDashboard;
