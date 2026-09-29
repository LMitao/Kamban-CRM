import { UserAccount, ActivityLog } from '../types/auth';

const STORAGE_USERS_KEY = 'crm_users_list_v1';
const STORAGE_CURRENT_USER_KEY = 'crm_session_user_v1';
const STORAGE_LOGS_KEY = 'crm_activity_logs_v1';

const OPERATOR_USERNAME = 'Operador';
const OPERATOR_PASSWORD = 'Vi*132457';

export function getStoredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      const defaultUsers: UserAccount[] = [
        {
          id: 'operator_root_id',
          username: OPERATOR_USERNAME,
          name: 'Operador Geral',
          email: 'operador@crm.sistema',
          role: 'operator',
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          isOnline: false,
          department: 'Administração & Monitoramento',
        },
      ];
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Erro ao ler usuários:', e);
    return [];
  }
}

export function saveStoredUsers(users: UserAccount[]) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Erro ao salvar usuários:', e);
  }
}

export function getActivityLogs(): ActivityLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function logActivity(user: { id?: string; username: string }, action: string, category: 'auth' | 'task' | 'system' = 'task', details?: string) {
  try {
    const logs = getActivityLogs();
    const newLog: ActivityLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}_${Math.random()}`,
      userId: user.id || 'anonymous',
      username: user.username,
      action,
      category,
      timestamp: new Date().toISOString(),
      details,
    };
    const updated = [newLog, ...logs].slice(0, 300); // keep last 300 logs
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Erro ao registrar log de atividade:', e);
  }
}

export function getCurrentUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user: UserAccount | null) {
  if (user) {
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  }
}

export function loginUser(usernameInput: string, passwordInput: string): { success: boolean; user?: UserAccount; error?: string } {
  const cleanUsername = usernameInput.trim();
  const cleanPassword = passwordInput.trim();

  if (!cleanUsername || !cleanPassword) {
    return { success: false, error: 'Por favor, informe login e senha.' };
  }

  // Operator verification
  if (cleanUsername.toLowerCase() === OPERATOR_USERNAME.toLowerCase()) {
    if (cleanPassword === OPERATOR_PASSWORD) {
      const users = getStoredUsers();
      let operatorUser = users.find((u) => u.username.toLowerCase() === OPERATOR_USERNAME.toLowerCase());
      const now = new Date().toISOString();

      if (!operatorUser) {
        operatorUser = {
          id: 'operator_root_id',
          username: OPERATOR_USERNAME,
          name: 'Operador Geral',
          email: 'operador@crm.sistema',
          role: 'operator',
          status: 'active',
          createdAt: now,
          lastLogin: now,
          isOnline: true,
          department: 'Administração & Monitoramento',
        };
        users.push(operatorUser);
      } else {
        operatorUser.lastLogin = now;
        operatorUser.isOnline = true;
      }

      saveStoredUsers(users);
      setCurrentUser(operatorUser);
      logActivity(operatorUser, 'Operador iniciou sessão no Painel de Monitoramento', 'auth');
      return { success: true, user: operatorUser };
    } else {
      logActivity({ username: cleanUsername }, 'Tentativa de login com senha incorreta para Operador', 'auth');
      return { success: false, error: 'Senha incorreta para a conta de Operador.' };
    }
  }

  // Normal user verification
  const users = getStoredUsers();
  const user = users.find(
    (u) =>
      u.username.toLowerCase() === cleanUsername.toLowerCase() ||
      u.email.toLowerCase() === cleanUsername.toLowerCase()
  );

  if (!user) {
    return { success: false, error: 'Usuário não encontrado. Se ainda não possui acesso, cadastre-se abaixo.' };
  }

  if (user.status === 'blocked') {
    logActivity(user, 'Tentativa de login de conta bloqueada', 'auth');
    return { success: false, error: 'Esta conta está bloqueada pelo Operador. Entre em contato com o suporte.' };
  }

  if (user.password && user.password !== cleanPassword) {
    logActivity(user, 'Tentativa de login com senha incorreta', 'auth');
    return { success: false, error: 'Senha incorreta.' };
  }

  const now = new Date().toISOString();
  user.lastLogin = now;
  user.isOnline = true;
  saveStoredUsers(users);
  setCurrentUser(user);
  logActivity(user, `Usuário "${user.name}" iniciou sessão no CRM`, 'auth');

  return { success: true, user };
}

export function registerUser(data: {
  username: string;
  name: string;
  email: string;
  password: string;
  department?: string;
}): { success: boolean; user?: UserAccount; error?: string } {
  const cleanUsername = data.username.trim();
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.name.trim();
  const cleanPassword = data.password.trim();

  if (!cleanUsername || !cleanName || !cleanPassword) {
    return { success: false, error: 'Nome, Login e Senha são obrigatórios.' };
  }

  if (cleanUsername.toLowerCase() === OPERATOR_USERNAME.toLowerCase()) {
    return { success: false, error: 'O nome de usuário "Operador" é reservado para a administração.' };
  }

  const users = getStoredUsers();

  if (users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
    return { success: false, error: 'Este login já está em uso por outro membro.' };
  }

  if (cleanEmail && users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'Este e-mail já está cadastrado.' };
  }

  const now = new Date().toISOString();
  const newUser: UserAccount = {
    id: crypto.randomUUID ? crypto.randomUUID() : `user_${Date.now()}`,
    username: cleanUsername,
    name: cleanName,
    email: cleanEmail || `${cleanUsername}@crm.local`,
    role: 'user',
    status: 'active',
    createdAt: now,
    lastLogin: now,
    isOnline: true,
    password: cleanPassword,
    department: data.department?.trim() || 'Comercial / Vendas',
  };

  users.push(newUser);
  saveStoredUsers(users);
  setCurrentUser(newUser);

  logActivity(newUser, `Novo usuário "${newUser.name}" se cadastrou no sistema`, 'auth');

  return { success: true, user: newUser };
}

export function logoutUser(user: UserAccount | null) {
  if (user) {
    const users = getStoredUsers();
    const existing = users.find((u) => u.id === user.id);
    if (existing) {
      existing.isOnline = false;
      saveStoredUsers(users);
    }
    logActivity(user, `Usuário "${user.username}" encerrou a sessão`, 'auth');
  }
  setCurrentUser(null);
}

export function updateUserStatus(userId: string, newStatus: 'active' | 'blocked', operatorUser: UserAccount) {
  const users = getStoredUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) return;
  if (target.role === 'operator') return; // Cannot block operator

  target.status = newStatus;
  if (newStatus === 'blocked') {
    target.isOnline = false;
  }
  saveStoredUsers(users);
  logActivity(
    operatorUser,
    `Operador ${newStatus === 'blocked' ? 'bloqueou' : 'desbloqueou'} o acesso do usuário "${target.username}"`,
    'system'
  );
}

export function deleteUserAccount(userId: string, operatorUser: UserAccount) {
  const users = getStoredUsers();
  const target = users.find((u) => u.id === userId);
  if (!target || target.role === 'operator') return;

  const filtered = users.filter((u) => u.id !== userId);
  saveStoredUsers(filtered);
  logActivity(operatorUser, `Operador excluiu o usuário "${target.username}" do sistema`, 'system');
}

export function resetUserPassword(userId: string, newPass: string, operatorUser: UserAccount) {
  const users = getStoredUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) return;

  target.password = newPass;
  saveStoredUsers(users);
  logActivity(operatorUser, `Operador redefiniu a senha do usuário "${target.username}"`, 'system');
}
