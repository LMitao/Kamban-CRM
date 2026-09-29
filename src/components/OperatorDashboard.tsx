import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  Clock, 
  Search, 
  UserX, 
  UserCheck, 
  Trash2, 
  KeyRound, 
  Trello, 
  LogOut, 
  Database, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Eye,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { UserAccount, ActivityLog } from '../types/auth';
import { Task } from '../types/crm';
import { 
  getStoredUsers, 
  getActivityLogs, 
  updateUserStatus, 
  deleteUserAccount, 
  resetUserPassword 
} from '../services/authService';
import { deleteFinishedTasks } from '../services/crmService';

interface Props {
  operator: UserAccount;
  tasks: Task[];
  onOpenKanban: () => void;
  onLogout: () => void;
  onOpenSupabaseModal: () => void;
  onTasksUpdated: () => void;
}

export const OperatorDashboard: React.FC<Props> = ({
  operator,
  tasks,
  onOpenKanban,
  onLogout,
  onOpenSupabaseModal,
  onTasksUpdated,
}) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [selectedTab, setSelectedTab] = useState<'users' | 'tasks' | 'logs'>('users');
  const [filterUserLoginForTasks, setFilterUserLoginForTasks] = useState<string>('all');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Password reset modal state
  const [resetModalUser, setResetModalUser] = useState<UserAccount | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const loadData = () => {
    setUsers(getStoredUsers());
    setLogs(getActivityLogs());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Live poll every 5s
    return () => clearInterval(interval);
  }, []);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleToggleUserStatus = (user: UserAccount) => {
    const nextStatus = user.status === 'active' ? 'blocked' : 'active';
    updateUserStatus(user.id, nextStatus, operator);
    loadData();
    showFeedback(
      nextStatus === 'blocked'
        ? `Usuário "${user.name}" foi bloqueado.`
        : `Usuário "${user.name}" foi desbloqueado com sucesso.`
    );
  };

  const handleDeleteUser = (user: UserAccount) => {
    if (confirm(`Tem certeza que deseja excluir o usuário "${user.name}" (${user.username})?`)) {
      deleteUserAccount(user.id, operator);
      loadData();
      showFeedback(`Usuário "${user.name}" excluído.`);
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPasswordInput.trim()) return;

    resetUserPassword(resetModalUser.id, newPasswordInput.trim(), operator);
    setResetModalUser(null);
    setNewPasswordInput('');
    loadData();
    showFeedback(`Senha do usuário "${resetModalUser.name}" redefinida.`);
  };

  const handleCleanFinishedTasks = async () => {
    if (confirm('Deseja excluir todas as tarefas já finalizadas do sistema?')) {
      const res = await deleteFinishedTasks();
      onTasksUpdated();
      showFeedback(`${res.count} tarefa(s) já feitas foram removidas.`);
    }
  };

  // Filtered users
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchUser.toLowerCase()))
  );

  const totalUsers = users.length;
  const activeOnlineUsers = users.filter((u) => u.isOnline).length;
  const totalTasks = tasks.length;
  const totalLogs = logs.length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base sm:text-lg text-white">
                    Painel do Operador
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                    Monitoramento Ativo
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Gerenciamento de acessos, auditoria e usuários do CRM
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={onOpenKanban}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-600/20 transition"
              >
                <Trello className="w-4 h-4" />
                <span className="hidden sm:inline">Visualizar Quadro Kanban</span>
              </button>

              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                title="Sair da Conta de Operador"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Feedback alert */}
        {feedbackMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Usuários Registrados</p>
              <h3 className="text-xl font-bold text-white">{totalUsers}</h3>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Usuários Online</p>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">{activeOnlineUsers}</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Tarefas no Sistema</p>
              <h3 className="text-xl font-bold text-white">{totalTasks}</h3>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Ações Auditadas</p>
              <h3 className="text-xl font-bold text-white">{totalLogs}</h3>
            </div>
          </div>
        </div>

        {/* Operator Controls Bar */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                selectedTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Monitorar Usuários ({totalUsers})
            </button>
            <button
              onClick={() => setSelectedTab('tasks')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                selectedTab === 'tasks'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Tarefas por Usuário ({totalTasks})
            </button>
            <button
              onClick={() => setSelectedTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                selectedTab === 'logs'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Histórico &amp; Auditoria ({totalLogs})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCleanFinishedTasks}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
              title="Deletar tarefas marcadas como finalizadas"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Limpar Tarefas Finalizadas</span>
            </button>

            <button
              onClick={onOpenSupabaseModal}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Configuração Supabase</span>
            </button>

            <button
              onClick={loadData}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Atualizar dados agora"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: USERS MONITOR */}
        {selectedTab === 'users' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
            {/* Table search & header */}
            <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, usuário ou departamento..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <span className="text-xs text-slate-400">
                Exibindo {filteredUsers.length} usuário(s)
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-700 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Usuário / Nome</th>
                    <th className="py-3 px-4">Login / E-mail</th>
                    <th className="py-3 px-4">Função / Setor</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Último Acesso</th>
                    <th className="py-3 px-4 text-right">Ações do Operador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-slate-300">
                  {filteredUsers.map((user) => {
                    const isOperatorUser = user.role === 'operator';
                    return (
                      <tr key={user.id} className="hover:bg-slate-700/30 transition">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs uppercase">
                              {user.name.slice(0, 2)}
                            </div>
                            <div>
                              <span>{user.name}</span>
                              {isOperatorUser && (
                                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  OPERADOR
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-mono text-slate-200 block">@{user.username}</span>
                            <span className="text-slate-400 text-[11px] block">{user.email}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-slate-300">
                            {user.department || 'Comercial'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {user.isOnline ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Online
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-700/50 text-slate-400 border border-slate-600/30">
                                Offline
                              </span>
                            )}

                            {user.status === 'blocked' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Bloqueado
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleString('pt-BR')
                            : 'Nunca acessou'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {!isOperatorUser ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(user)}
                                title={user.status === 'active' ? 'Bloquear Usuário' : 'Desbloquear Usuário'}
                                className={`p-1.5 rounded-lg border transition ${
                                  user.status === 'active'
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                              >
                                {user.status === 'active' ? (
                                  <UserX className="w-3.5 h-3.5" />
                                ) : (
                                  <UserCheck className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setResetModalUser(user);
                                  setNewPasswordInput('');
                                }}
                                title="Redefinir Senha do Usuário"
                                className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600/40 transition"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user)}
                                title="Excluir Usuário"
                                className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-rose-900/50 text-rose-400 border border-slate-600/40 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">
                              Conta Administradora
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: TASKS PER USER */}
        {selectedTab === 'tasks' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-xl p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
              <div>
                <h3 className="text-sm font-bold text-white">Tarefas por Usuário (Isolamento de Contas)</h3>
                <p className="text-xs text-slate-400">
                  Cada usuário visualiza apenas suas próprias tarefas. Como Operador, você pode auditar e filtrar por login.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Filtrar Login:</span>
                <select
                  value={filterUserLoginForTasks}
                  onChange={(e) => setFilterUserLoginForTasks(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Todos os logins ({tasks.length})</option>
                  {users.map((u) => {
                    const count = tasks.filter(
                      (t) =>
                        (t.created_by_login && t.created_by_login.toLowerCase() === u.username.toLowerCase()) ||
                        (t.created_by && t.created_by.toLowerCase() === u.username.toLowerCase())
                    ).length;
                    return (
                      <option key={u.id} value={u.username}>
                        @{u.username} - {u.name} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* List of tasks */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {tasks
                .filter((t) => {
                  if (filterUserLoginForTasks === 'all') return true;
                  const login = (t.created_by_login || t.created_by || '').toLowerCase();
                  return login === filterUserLoginForTasks.toLowerCase();
                })
                .map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{task.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {task.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-slate-400 text-xs line-clamp-1">{task.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span>
                          Dono do Login:{' '}
                          <strong className="text-indigo-400 font-mono">
                            @{task.created_by_login || task.created_by_name || 'Desconhecido'}
                          </strong>
                        </span>
                        {task.contact_name && (
                          <span>
                            Contato: <strong className="text-slate-300">{task.contact_name}</strong>
                          </span>
                        )}
                        {task.company_name && (
                          <span>
                            Empresa: <strong className="text-slate-300">{task.company_name}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-1 flex-shrink-0">
                      {task.deal_value && task.deal_value > 0 ? (
                        <span className="font-bold text-emerald-400">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(task.deal_value)}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">R$ 0,00</span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(task.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}

              {tasks.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Nenhuma tarefa ativa cadastrada no sistema.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: ACTIVITY AUDIT LOGS */}
        {selectedTab === 'logs' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div>
                <h3 className="text-sm font-bold text-white">Registro de Auditoria do Sistema</h3>
                <p className="text-xs text-slate-400">
                  Rastreamento em tempo real de acessos, criações de tarefas e alterações
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {logs.length} eventos registrados
              </span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-700/60 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        log.category === 'auth'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : log.category === 'system'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">@{log.username}</span>
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {log.category}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-0.5">{log.action}</p>
                      {log.details && (
                        <p className="text-slate-400 text-[11px] mt-0.5">{log.details}</p>
                      )}
                    </div>
                  </div>

                  <span className="text-slate-500 text-[11px] flex-shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}{' '}
                    - {new Date(log.timestamp).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}

              {logs.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Nenhum evento registrado no histórico até o momento.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-indigo-400">
              <KeyRound className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">Redefinir Senha</h3>
            </div>
            <p className="text-xs text-slate-400">
              Defina uma nova senha de acesso para o usuário <strong>{resetModalUser.name}</strong> (@{resetModalUser.username}).
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nova Senha
                </label>
                <input
                  type="text"
                  required
                  placeholder="Digite a nova senha"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
