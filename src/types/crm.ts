export type TaskStatus = 'Não iniciado' | 'Em Andamento' | 'Finalizado';

export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  deal_value: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_name: string;
  tags: string[];
  due_date: string | null;
  position: number;
  created_by?: string;
  created_by_login?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastChecked?: string;
  errorMessage?: string;
}

export const TASK_STATUSES: { key: TaskStatus; label: string; color: string; bgLight: string; border: string; badge: string }[] = [
  {
    key: 'Não iniciado',
    label: 'Não iniciado',
    color: 'text-slate-700 dark:text-slate-300',
    bgLight: 'bg-slate-100/80 dark:bg-slate-800/60',
    border: 'border-slate-200 dark:border-slate-700/80',
    badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
  },
  {
    key: 'Em Andamento',
    label: 'Em Andamento',
    color: 'text-blue-700 dark:text-blue-300',
    bgLight: 'bg-blue-50/70 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800/60',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
  },
  {
    key: 'Finalizado',
    label: 'Finalizado',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgLight: 'bg-emerald-50/70 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
  }
];

export const TASK_PRIORITIES: { key: TaskPriority; label: string; badge: string }[] = [
  { key: 'Baixa', label: 'Baixa', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
  { key: 'Média', label: 'Média', badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
  { key: 'Alta', label: 'Alta', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  { key: 'Urgente', label: 'Urgente', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800' }
];
