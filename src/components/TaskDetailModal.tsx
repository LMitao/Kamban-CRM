import React from 'react';
import { 
  X, 
  Edit3, 
  Trash2, 
  Calendar, 
  DollarSign, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Clock, 
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Tag as TagIcon
} from 'lucide-react';
import { Task, TaskStatus, TASK_STATUSES, TASK_PRIORITIES } from '../types/crm';

interface Props {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

export const TaskDetailModal: React.FC<Props> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  if (!isOpen || !task) return null;

  const currentStatusObj = TASK_STATUSES.find((s) => s.key === task.status);
  const currentPriorityObj = TASK_PRIORITIES.find((p) => p.key === task.priority);

  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(task.deal_value || 0);

  const cleanPhone = task.contact_phone ? task.contact_phone.replace(/\D/g, '') : '';
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.length <= 11 ? '55' + cleanPhone : cleanPhone}`
    : '';

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir a tarefa "${task.title}"?`)) {
      onDelete(task.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-start justify-between">
          <div className="space-y-1.5 pr-4 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${currentStatusObj?.badge}`}>
                {task.status}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${currentPriorityObj?.badge}`}>
                Prioridade {task.priority}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {task.title}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              title="Editar Tarefa"
              className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              title="Excluir Tarefa"
              className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Quick status switch */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Mudar Status Rapidamente
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TASK_STATUSES.map((st) => {
                const isActive = task.status === st.key;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => onStatusChange(task.id, st.key)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold text-center transition border ${
                      isActive
                        ? `${st.badge} shadow-sm font-bold`
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deal Value & Due Date Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Valor Oportunidade
              </span>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {formattedValue}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Prazo / Vencimento
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
              </p>
            </div>
          </div>

          {/* Contact & Company details */}
          {(task.contact_name || task.company_name || task.contact_email || task.contact_phone) && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Contato &amp; Empresa
              </span>

              {task.contact_name && (
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="font-medium">{task.contact_name}</span>
                </div>
              )}

              {task.company_name && (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{task.company_name}</span>
                </div>
              )}

              {task.contact_email && (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <a
                    href={`mailto:${task.contact_email}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    {task.contact_email}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {task.contact_phone && (
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{task.contact_phone}</span>
                  </div>

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Descrição / Detalhes
            </span>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {task.description || <span className="text-slate-400 italic">Nenhuma anotação adicional informada.</span>}
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Etiquetas
              </span>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    <TagIcon className="w-3 h-3 text-slate-400" />
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meta timestamps */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-1.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Criada em: {new Date(task.created_at).toLocaleString('pt-BR')}
            </span>
            {(task.created_by_login || task.created_by_name) && (
              <span className="flex items-center gap-1 text-slate-500">
                <User className="w-3 h-3 text-slate-400" />
                Criada por: <strong className="text-slate-700 dark:text-slate-300">@{task.created_by_login || task.created_by_name}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleDelete}
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir Tarefa
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editar Dados
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
