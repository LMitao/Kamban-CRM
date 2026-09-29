import React, { useState } from 'react';
import { 
  Trello, 
  Lock, 
  User, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Eye, 
  EyeOff, 
  Users,
  Sparkles
} from 'lucide-react';
import { loginUser, registerUser } from '../services/authService';
import { UserAccount } from '../types/auth';

interface Props {
  onLoginSuccess: (user: UserAccount) => void;
}

export const AuthScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'operator'>('login');
  
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('Vendas & Comercial');

  // Status & error
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = loginUser(username, password);
      setLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Credenciais inválidas.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Erro ao processar login.');
    }
  };

  const handleOperatorFill = () => {
    setUsername('Operador');
    setPassword('Vi*132457');
    setError(null);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = registerUser({
        name: regName,
        username: regUsername,
        email: regEmail,
        password: regPassword,
        department: regDepartment,
      });
      setLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Erro ao criar conta.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Erro no cadastro.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25 mb-3">
            <Trello className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            CRM Kanban
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Plataforma de Gestão de Negócios e Acompanhamento de Equipe
          </p>
        </div>

        {/* Card container */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Top selector buttons */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl mb-6 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'login' || mode === 'operator'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Criar Conta
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Operator Selector Pill */}
          {(mode === 'login' || mode === 'operator') && (
            <div className="mb-5 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-indigo-300 text-xs">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Acesso administrativo disponível</span>
              </div>
              <button
                type="button"
                onClick={handleOperatorFill}
                className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-lg transition"
              >
                Preencher Operador
              </button>
            </div>
          )}

          {/* Form: LOGIN */}
          {(mode === 'login' || mode === 'operator') && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Usuário ou E-mail
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Seu usuário ou Operador"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
              >
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                Não tem uma conta ainda?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  Cadastre-se grátis
                </button>
              </div>
            </form>
          )}

          {/* Form: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Mendes"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Nome de Usuário
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="carlos.mendes"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Departamento
                  </label>
                  <select
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Vendas & Comercial">Vendas & Comercial</option>
                    <option value="Atendimento & Suporte">Atendimento & Suporte</option>
                    <option value="Projetos & Operações">Projetos & Operações</option>
                    <option value="Diretoria">Diretoria</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  E-mail Profissional
                </label>
                <input
                  type="email"
                  required
                  placeholder="carlos@empresa.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Criar Senha
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
              >
                <span>Criar Minha Conta e Acessar</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                Já possui cadastro?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  Fazer login
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info credentials */}
        <div className="mt-6 text-center text-[11px] text-slate-500 space-y-1">
          <p>
            Monitoramento do Operador: <code className="text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">Login: Operador</code> | <code className="text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">Senha: Vi*132457</code>
          </p>
        </div>
      </div>
    </div>
  );
};
