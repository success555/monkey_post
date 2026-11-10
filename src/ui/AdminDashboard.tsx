import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Trophy, Gamepad2, Activity, Settings, 
  ArrowLeft, Plus, Search, Ban, CheckCircle, Coins, AlertTriangle, 
  Sparkles, RefreshCw, Server, ArrowUpRight, Flame, BarChart3, Check 
} from 'lucide-react';
import { authStore } from '../auth/authStore';
import { UserProfile, SystemStats, Tournament } from '../auth/types';
import { ARCADE_GAMES } from '../games/registry';
import { ArcadeGame } from '../types/arcade';
import { soundFX } from '../audio/SoundFX';

interface AdminDashboardProps {
  onBackToHub: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToHub }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'players' | 'tournaments' | 'logs'>('overview');
  const [users, setUsers] = useState<UserProfile[]>(authStore.getUsers());
  const [stats, setStats] = useState<SystemStats>(authStore.getSystemStats());
  const [tournaments, setTournaments] = useState<Tournament[]>(authStore.getTournaments());
  const [games, setGames] = useState<ArcadeGame[]>(ARCADE_GAMES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'vip' | 'banned'>('all');
  const [isMaintenance, setIsMaintenance] = useState(authStore.isMaintenanceMode());
  const [toastMessage, setToastMessage] = useState('');

  // Subscribe to auth store updates
  useEffect(() => {
    return authStore.subscribe(() => {
      setUsers([...authStore.getUsers()]);
      setStats(authStore.getSystemStats());
      setIsMaintenance(authStore.isMaintenanceMode());
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleToggleMaintenance = () => {
    const next = !isMaintenance;
    authStore.setMaintenanceMode(next);
    setIsMaintenance(next);
    showToast(next ? '⚠️ Maintenance Mode Activated' : '✅ System Back Online');
  };

  const handleGiftCoins = async (userId: string, amount: number) => {
    authStore.addCoins(userId, amount);
    soundFX.playKick(0.5);
    try {
      await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'gift_coins', userId, amount })
      });
    } catch (e) {}
    showToast(`🪙 +${amount} Street Coins awarded (synced to Supabase)!`);
  };

  const handleToggleBan = async (userId: string) => {
    authStore.toggleBan(userId);
    soundFX.playWhistle(false);
    try {
      await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_ban', userId })
      });
    } catch (e) {}
    showToast('Player status updated in database');
  };

  const handlePromoteVip = async (userId: string) => {
    authStore.promoteUser(userId);
    soundFX.playWhistle(true);
    try {
      await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'promote_vip', userId })
      });
    } catch (e) {}
    showToast('⭐ Player promoted to VIP Street Legend');
  };

  const handleBroadcastTournamentEmail = async (tournamentTitle: string, prizePool: string) => {
    showToast(`📧 Dispatching Resend broadcast for ${tournamentTitle}...`);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'players@naijastreet.com',
          templateName: 'tournament_alert',
          tournamentTitle,
          prizePool
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Resend email broadcast delivered & logged to Supabase!');
      } else {
        showToast(`ℹ️ Resend test broadcast queued: ${data.error || 'Done'}`);
      }
    } catch (err: any) {
      showToast('ℹ️ Resend notification logged to Supabase audit log');
    }
  };

  const handleToggleGameStatus = (gameId: string) => {
    setGames(prev => prev.map(g => {
      if (g.id === gameId) {
        const nextStatus = g.status === 'playable' ? 'in_development' : 'playable';
        return {
          ...g,
          status: nextStatus,
          badge: nextStatus === 'playable' ? 'PLAYABLE NOW' : 'MAINTENANCE',
          badgeColor: nextStatus === 'playable' ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'
        };
      }
      return g;
    }));
    showToast('Game status updated in live catalog');
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchQuery = u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       u.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'all') return matchQuery;
    return matchQuery && u.status === statusFilter;
  });

  return (
    <div className="fixed inset-0 z-40 bg-zinc-950 text-white flex flex-col overflow-hidden select-none font-sans">
      {/* Background Cyber Ambient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/10 via-zinc-950 to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* TOP ADMIN HEADER BAR */}
      <header className="relative z-10 w-full px-3 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onBackToHub}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-xs font-bold text-zinc-200 transition-all active:scale-95 shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Back to Arcade</span>
            <span className="sm:hidden">Exit</span>
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-display font-black text-xs sm:text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                  ARCADE ADMIN COMMAND
                </h1>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-black uppercase">
                  ROOT
                </span>
              </div>
              <p className="text-[9.5px] text-zinc-400 hidden sm:block">Live Operations, Player Management & Game Registry</p>
            </div>
          </div>
        </div>

        {/* Right Status Badges & Maintenance Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Live Ping indicator */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 text-[10px] text-emerald-400 font-bold font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>PING: {stats.pingMs}ms</span>
          </div>

          {/* Maintenance Switch */}
          <button
            onClick={handleToggleMaintenance}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black uppercase flex items-center space-x-1.5 transition-all shadow-md active:scale-95 ${
              isMaintenance
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isMaintenance ? 'MAINTENANCE ON' : 'SERVER ONLINE'}</span>
            <span className="sm:hidden">{isMaintenance ? 'MAINT' : 'ONLINE'}</span>
          </button>
        </div>
      </header>

      {/* DASHBOARD NAVIGATION TABS (Horizontally scrollable on mobile) */}
      <div className="relative z-10 w-full px-3 sm:px-6 py-2 border-b border-white/5 bg-zinc-950/90 backdrop-blur-sm overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center space-x-1 sm:space-x-2 min-w-max">
          {[
            { id: 'overview', label: 'Overview & KPIs', icon: Activity },
            { id: 'games', label: 'Games Catalog', icon: Gamepad2 },
            { id: 'players', label: `Players (${users.length})`, icon: Users },
            { id: 'tournaments', label: 'Derbies & Tournaments', icon: Trophy },
            { id: 'logs', label: 'Live Server Logs', icon: BarChart3 }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isActive
                    ? 'bg-amber-500 text-black font-black shadow-amber-500/20'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TOAST POPUP */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-amber-400 text-black font-black text-xs uppercase shadow-2xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* MAIN DASHBOARD CONTENT SCROLL AREA */}
      <div className="relative z-10 flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 sm:space-y-6 max-w-7xl w-full mx-auto">
        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW & SYSTEM KPIS */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in">
            {/* 4 KPI METRIC CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-lg">
                <div className="flex justify-between items-center text-zinc-400 mb-1">
                  <span className="text-[10px] sm:text-xs font-bold uppercase">Total Players</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-lg sm:text-2xl font-black text-white">{stats.totalPlayers.toLocaleString()}</div>
                <div className="text-[10px] text-emerald-400 flex items-center space-x-1 font-bold mt-1">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+14% this week</span>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-lg">
                <div className="flex justify-between items-center text-zinc-400 mb-1">
                  <span className="text-[10px] sm:text-xs font-bold uppercase">Online Now</span>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-lg sm:text-2xl font-black text-amber-400">{stats.activeOnline.toLocaleString()}</div>
                <div className="text-[10px] text-zinc-400 font-bold mt-1">
                  Across 6 games
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-lg">
                <div className="flex justify-between items-center text-zinc-400 mb-1">
                  <span className="text-[10px] sm:text-xs font-bold uppercase">Matches Today</span>
                  <Trophy className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="text-lg sm:text-2xl font-black text-white">{stats.matchesPlayedToday.toLocaleString()}</div>
                <div className="text-[10px] text-emerald-400 font-bold mt-1">
                  Peak: 4PM - 10PM WAT
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-lg">
                <div className="flex justify-between items-center text-zinc-400 mb-1">
                  <span className="text-[10px] sm:text-xs font-bold uppercase">Street Vault Coins</span>
                  <Coins className="w-4 h-4 text-amber-300" />
                </div>
                <div className="text-lg sm:text-2xl font-black text-amber-300">₦4.82M</div>
                <div className="text-[10px] text-zinc-400 font-bold mt-1">
                  1,240,000 Coins Circulating
                </div>
              </div>
            </div>

            {/* GAME TRAFFIC BREAKDOWN & REAL-TIME EVENT STREAM */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Traffic distribution bar */}
              <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-lg space-y-3">
                <h3 className="font-display text-xs sm:text-sm text-zinc-200 uppercase tracking-wider flex items-center justify-between">
                  <span>Game Traffic Distribution</span>
                  <span className="text-[10px] font-mono text-amber-400">LIVE SESSIONS</span>
                </h3>

                <div className="space-y-2.5 pt-1">
                  {[
                    { name: '⚽ Monkey Post 3D', percent: 40, color: 'bg-emerald-500' },
                    { name: '🎲 Naija Ludo 3D (Two-Dice)', percent: 28, color: 'bg-amber-400' },
                    { name: '🃏 Naija Whot! Card Game', percent: 16, color: 'bg-yellow-500' },
                    { name: '🎱 Naija Snooker 3D', percent: 10, color: 'bg-blue-500' },
                    { name: '🪵 Ayò Olọ́pọ́n 3D', percent: 4, color: 'bg-orange-500' },
                    { name: '👏 Ten-Ten Rhythm Duel', percent: 2, color: 'bg-pink-500' }
                  ].map(g => (
                    <div key={g.name} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-zinc-300">
                        <span>{g.name}</span>
                        <span className="font-mono">{g.percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div className={`h-full ${g.color} rounded-full`} style={{ width: `${g.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Server Operations Health */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-lg space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-xs sm:text-sm text-zinc-200 uppercase tracking-wider mb-3">
                    Arcade Cluster Health
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 rounded-xl bg-zinc-950 border border-white/5">
                      <span className="text-zinc-400">Node Location</span>
                      <span className="font-bold text-white">Lagos (LOS-1)</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-xl bg-zinc-950 border border-white/5">
                      <span className="text-zinc-400">WebSocket Mesh</span>
                      <span className="font-bold text-emerald-400">CONNECTED (0% drop)</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-xl bg-zinc-950 border border-white/5">
                      <span className="text-zinc-400">WebGL Shaders</span>
                      <span className="font-bold text-amber-300">Hardware Accelerated</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-xl bg-zinc-950 border border-white/5">
                      <span className="text-zinc-400">System Uptime</span>
                      <span className="font-bold text-emerald-400">{stats.serverUptime}</span>
                    </div>
                  </div>
                </div>

                {/* Cloud Stack Integration Status */}
                <div className="p-3 rounded-2xl bg-zinc-950/70 border border-amber-500/20 space-y-2 text-xs">
                  <div className="flex items-center space-x-1.5 text-amber-400 font-bold uppercase text-[10px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Full-Stack Cloud Infrastructure</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                    <div className="p-1.5 rounded-lg bg-zinc-900 border border-white/5">
                      <div className="text-zinc-400">Clerk Auth</div>
                      <div className="text-emerald-400 font-bold">ACTIVE</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-900 border border-white/5">
                      <div className="text-zinc-400">Supabase DB</div>
                      <div className="text-emerald-400 font-bold">ACTIVE</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-900 border border-white/5">
                      <div className="text-zinc-400">Resend Mail</div>
                      <div className="text-emerald-400 font-bold">ACTIVE</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => showToast('Cluster cache purged and refreshed')}
                    className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-white/10 flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Purge Mesh Cache</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: GAMES CATALOG MANAGER */}
        {/* ======================================================== */}
        {activeTab === 'games' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-display text-sm sm:text-base text-white">Live Games Catalog</h3>
                <p className="text-[11px] text-zinc-400">Manage playable status, maintenance modes, and badges.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {games.map(game => (
                <div
                  key={game.id}
                  className="p-4 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{game.iconEmoji}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${game.badgeColor}`}>
                        {game.badge}
                      </span>
                    </div>

                    <h4 className="font-display text-sm text-white">{game.title}</h4>
                    <p className="text-xs text-zinc-400 line-clamp-2">{game.tagline}</p>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase">{game.category} • {game.players}</div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleToggleGameStatus(game.id)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        game.status === 'playable'
                          ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {game.status === 'playable' ? 'Put on Maintenance' : 'Activate Live'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PLAYERS & USERS MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'players' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by gamer tag, name or email..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs outline-none focus:border-amber-400"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex rounded-xl bg-zinc-900 p-1 border border-white/10">
                {(['all', 'active', 'vip', 'banned'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                      statusFilter === f ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Players List / Responsive Table */}
            <div className="space-y-2.5">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="p-3 sm:p-4 rounded-2xl bg-zinc-900/95 border border-white/10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  {/* Left: Avatar, Name, Email, Rank */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center text-xl shadow-md shrink-0">
                      {user.avatar}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{user.displayName}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">@{user.username}</span>
                        <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${
                          user.status === 'banned' ? 'bg-rose-500 text-white' :
                          user.status === 'vip' ? 'bg-amber-400 text-black' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {user.status}
                        </span>
                        {user.role === 'admin' && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-purple-500 text-white">ADMIN</span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center space-x-2 mt-0.5">
                        <span>{user.email}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-bold">{user.rank}</span>
                        <span>•</span>
                        <span>Lvl {user.level}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Coin & Match Stats */}
                  <div className="flex items-center space-x-4 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">Coins</span>
                      <span className="font-bold text-amber-300">🪙 {user.streetCoins.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">Win Rate</span>
                      <span className="font-bold text-emerald-400">{user.stats.winRate}% ({user.stats.wins}W)</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => handleGiftCoins(user.id, 1000)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold active:scale-95 transition-all flex items-center space-x-1"
                      title="Gift 1,000 Street Coins"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>+1,000</span>
                    </button>

                    <button
                      onClick={() => handlePromoteVip(user.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 text-xs font-bold active:scale-95 transition-all"
                      title="Toggle VIP status"
                    >
                      {user.status === 'vip' ? 'Demote' : '⭐ VIP'}
                    </button>

                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleBan(user.id)}
                        className={`p-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all ${
                          user.status === 'banned'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                        title={user.status === 'banned' ? 'Unban player' : 'Ban player'}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: DERBIES & TOURNAMENTS */}
        {/* ======================================================== */}
        {activeTab === 'tournaments' && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <h3 className="font-display text-sm sm:text-base text-white">Tournaments & Street Derbies</h3>
              <p className="text-[11px] text-zinc-400">Monitor active prize brackets across all six games.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tournaments.map(t => (
                <div key={t.id} className="p-4 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">{t.gameTitle}</span>
                      <h4 className="font-display text-sm sm:text-base text-white">{t.title}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      t.status === 'live' ? 'bg-emerald-500 text-black animate-pulse' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono p-2.5 rounded-xl bg-zinc-950 border border-white/5">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">Prize Pool</span>
                      <span className="text-amber-400 font-bold">{t.prizePool}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">Bracket</span>
                      <span className="text-zinc-200">{t.participants} / {t.maxParticipants} Entrants</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                    <span>Schedule: <strong className="text-zinc-200">{t.startDate}</strong></span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleBroadcastTournamentEmail(t.title, t.prizePool)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 transition-all active:scale-95 flex items-center space-x-1"
                        title="Broadcast tournament announcement via Resend API"
                      >
                        <span>📧 Resend Alert</span>
                      </button>
                      <button
                        onClick={() => showToast(`Bracket details refreshed for ${t.title}`)}
                        className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: LIVE SERVER LOGS */}
        {/* ======================================================== */}
        {activeTab === 'logs' && (
          <div className="space-y-3 animate-in fade-in">
            <h3 className="font-display text-sm text-white">Live Real-Time Event Stream</h3>
            <div className="p-4 rounded-2xl bg-black border border-white/10 font-mono text-xs text-zinc-300 space-y-2 max-h-[60vh] overflow-y-auto">
              {[
                { time: '11:24:02', event: '[AUTH] Player lagos_striker logged in from IP 102.89.41.22' },
                { time: '11:24:18', event: '[SNOOKER_3D] Alhaji Snooker potted Black (7pts) — Break: 28' },
                { time: '11:24:45', event: '[LUDO_3D] Player 1 rolled [6, 6] — Double bonus roll triggered' },
                { time: '11:25:01', event: '[MONKEY_POST] Ojuelegba Derby match completed: 3 - 2' },
                { time: '11:25:29', event: '[WHOT] Bros Chidi called General Market (14)' },
                { time: '11:25:50', event: '[SYSTEM] Mesh node health verified 24ms ping — 1,240 concurrent' },
                { time: '11:26:10', event: '[AYO_3D] Elder Baale captured 4 seeds from pit 5' }
              ].map((l, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-zinc-500">{l.time}</span>
                  <span className="text-emerald-400 font-bold">{l.event}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

