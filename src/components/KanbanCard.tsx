import React from 'react';
import { 
  Calendar, 
  DollarSign, 
  User, 
  Building2, 
  ChevronRight, 
  ChevronLeft, 
  GripVertical,
  MoreVertical,
  Edit,
  Trash2,
  Clock
} from 'lucide-react';
import { Task, TaskStatus, TASK_PRIORITIES, TASK_STATUSES } from '../types/crm';

interface Props {
  task: Task;
  onSelect: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

export const KanbanCard: React.FC<Props> = ({
  task,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  onDragStart,
}) => {
  const priorityObj = TASK_PRIORITIES.find((p) => p.key === task.priority);

  const formattedValue = task.deal_value && task.deal_value > 0
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(task.deal_value)
    : null;

  const isOverdue = task.due_date && new Date(task.due_date).getTime() < Date.now() && task.status !== 'Finalizado';

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === 'Não iniciado') return 'Em Andamento';
    if (current === 'Em Andamento') return 'Finalizado';
    return null;
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === 'Finalizado') return 'Em Andamento';
    if (current === 'Em Andamento') return 'Não iniciado';
    return null;
  };

  const nextStatus = getNextStatus(task.status);
  const prevStatus = getPrevStatus(task.status);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onSelect(task)}
      className="group relative bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer select-none space-y-3"
    >
      {/* Top row: Priority & Options */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${priorityObj?.badge || ''}`}>
            {task.priority}
          </span>
          {task.company_name && (
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate max-w-[140px]">
              <Building2 className="w-3 h-3 text-slate-400" />
              {task.company_name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            title="Editar Tarefa"
            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Excluir a tarefa "${task.title}"?`)) {
                onDelete(task.id);
              }
            }}
            title="Excluir Tarefa"
            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="text-slate-300 dark:text-slate-600 cursor-grab active:cursor-grabbing p-1">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
        {task.title}
      </h3>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Contact Name & Value */}
      <div className="flex items-center justify-between pt-1 text-xs">
        {task.contact_name ? (
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate max-w-[130px]">
            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{task.contact_name}</span>
          </div>
        ) : (
          <div />
        )}

        {formattedValue && (
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
            {formattedValue}
          </span>
        )}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] text-slate-400">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Bottom Bar: Due date & Fast status changer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        {task.due_date ? (
          <div
            className={`flex items-center gap-1 text-[11px] font-medium ${
              isOverdue
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>{new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
            {isOverdue && <span className="font-bold">(Atrasado)</span>}
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Sem prazo
          </span>
        )}

        {/* Quick move buttons */}
        <div className="flex items-center gap-1">
          {prevStatus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, prevStatus);
              }}
              title={`Mover para: ${prevStatus}`}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {nextStatus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, nextStatus);
              }}
              title={`Mover para: ${nextStatus}`}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium flex items-center gap-0.5 transition"
            >
              Avançar
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
