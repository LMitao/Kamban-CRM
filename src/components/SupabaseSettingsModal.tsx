import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  UploadCloud, 
  X, 
  KeyRound, 
  Server,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { 
  getStoredSupabaseCredentials, 
  saveSupabaseCredentials, 
  testSupabaseConnection, 
  SUPABASE_SQL_SETUP 
} from '../lib/supabase';
import { migrateLocalTasksToSupabase, getLocalTasks, getAllLocalTasks } from '../services/crmService';
import { getCurrentUser } from '../services/authService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnectionSuccess: () => void;
}

export const SupabaseSettingsModal: React.FC<Props> = ({ isOpen, onClose, onConnectionSuccess }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tableExists?: boolean } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'instructions'>('config');

  const currentUser = getCurrentUser();
  const isOperator = currentUser?.role === 'operator';
  const localTasksCount = isOperator ? getAllLocalTasks().length : getLocalTasks(currentUser?.username).length;

  useEffect(() => {
    if (isOpen) {
      const creds = getStoredSupabaseCredentials();
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
      setTestResult(null);
      setMigrationStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(url, anonKey);
    setTestResult(result);
    setIsTesting(false);

    if (result.success) {
      saveSupabaseCredentials(url, anonKey);
      onConnectionSuccess();
    }
  };

  const handleClearCredentials = () => {
    if (confirm('Deseja desconectar o Supabase? O sistema voltará a salvar tarefas no armazenamento local.')) {
      saveSupabaseCredentials('', '');
      setUrl('');
      setAnonKey('');
      setTestResult(null);
      onConnectionSuccess();
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    setMigrationStatus('Enviando tarefas locais para o Supabase...');
    const res = await migrateLocalTasksToSupabase(currentUser?.username, isOperator);
    setIsMigrating(false);
    if (res.error) {
      setMigrationStatus(`Erro ao migrar: ${res.error}`);
    } else {
      setMigrationStatus(`${res.count} tarefa(s) enviadas com sucesso ao Supabase!`);
      onConnectionSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Conexão com o Supabase
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Guarde suas tarefas e clientes diretamente no seu banco de dados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-900/60">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition ${
              activeTab === 'config'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Credenciais & Conexão
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'sql'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Script SQL da Tabela
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'instructions'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Passo a Passo
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-slate-700 dark:text-slate-300">
          {activeTab === 'config' && (
            <form onSubmit={handleTestAndSave} className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl text-xs space-y-1">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Integração Direta com Supabase
                </p>
                <p className="text-emerald-700 dark:text-emerald-400">
                  Todas as tarefas criadas manualmente, mudanças de status e edições serão sincronizadas em tempo real com seu projeto Supabase.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-slate-400" />
                  URL do Projeto Supabase
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://xyzabcdefg.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Encontrado em: <strong>Project Settings &gt; API &gt; Project URL</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  Chave Anon / Pública (anon key)
                </label>
                <input
                  type="password"
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Encontrado em: <strong>Project Settings &gt; API &gt; Project API keys &gt; anon public</strong>
                </span>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl text-sm flex items-start gap-2.5 border ${
                    testResult.success
                      ? testResult.tableExists === false
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    testResult.tableExists === false ? (
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    )
                  ) : (
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  )}
                  <div className="flex-1 text-xs leading-relaxed">
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.tableExists === false && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('sql')}
                        className="mt-2 inline-flex items-center gap-1 font-bold text-amber-800 dark:text-amber-300 underline hover:no-underline"
                      >
                        Ver script SQL para criar a tabela &rarr;
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Migration option if local tasks exist */}
              {localTasksCount > 0 && testResult?.success && (
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Tarefas criadas localmente ({localTasksCount})
                    </span>
                    <p className="text-slate-500">
                      Você pode migrar as tarefas salvas localmente para o Supabase agora.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleMigrate}
                    disabled={isMigrating}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    {isMigrating ? 'Migrando...' : 'Migrar para Supabase'}
                  </button>
                </div>
              )}

              {migrationStatus && (
                <p className="text-xs text-center font-medium text-emerald-600 dark:text-emerald-400">
                  {migrationStatus}
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                {url || anonKey ? (
                  <button
                    type="button"
                    onClick={handleClearCredentials}
                    className="text-xs text-rose-500 hover:text-rose-700 underline"
                  >
                    Desconectar Supabase
                  </button>
                ) : <div />}

                <button
                  type="submit"
                  disabled={isTesting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex items-center gap-2 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Testando conexão...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Testar e Salvar Conexão
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Execute este script no <strong>SQL Editor</strong> do painel Supabase para criar a tabela com os campos e políticas de acesso adequadas:
                </p>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar SQL
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 max-h-72 leading-relaxed">
                  {SUPABASE_SQL_SETUP}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Crie um projeto no Supabase</h4>
                    <p className="text-slate-500 mt-0.5">
                      Acesse <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5 underline">supabase.com <ExternalLink className="w-3 h-3" /></a> e crie um novo projeto gratuito.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Execute o Script SQL</h4>
                    <p className="text-slate-500 mt-0.5">
                      No painel do Supabase, clique em <strong>SQL Editor</strong> no menu lateral, cole o script da aba &quot;Script SQL da Tabela&quot; e clique no botão verde <strong>RUN</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Copie as chaves de API</h4>
                    <p className="text-slate-500 mt-0.5">
                      Acesse <strong>Project Settings &gt; API</strong> e copie a <strong>Project URL</strong> e a <strong>anon / public key</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    4
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Pronto!</h4>
                    <p className="text-slate-500 mt-0.5">
                      Cole as credenciais na aba &quot;Credenciais &amp; Conexão&quot; e salve. Todas as tarefas manuais criadas no Kanban serão salvas diretamente no Supabase!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
