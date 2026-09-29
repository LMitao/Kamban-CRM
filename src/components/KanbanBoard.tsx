import React, { useState } from 'react';
import { 
  Plus, 
  CircleDashed, 
  Clock, 
  CheckCircle2, 
  Inbox, 
  DollarSign
} from 'lucide-react';
import { Task, TaskStatus, TASK_STATUSES } from '../types/crm';
import { KanbanCard } from './KanbanCard';

interface Props {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onAddTaskInStatus: (status: TaskStatus) => void;
}

export const KanbanBoard: React.FC<Props> = ({
  tasks,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onAddTaskInStatus,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving to outside
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (taskId) {
      onStatusChange(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'Não iniciado':
        return <CircleDashed className="w-4 h-4 text-slate-500" />;
      case 'Em Andamento':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Finalizado':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
      {TASK_STATUSES.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.key);
        const columnTotalValue = columnTasks.reduce((sum, t) => sum + (t.deal_value || 0), 0);
        const isHovered = dragOverColumn === col.key;

        return (
          <div
            key={col.key}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.key)}
            className={`flex flex-col rounded-2xl p-4 transition-all duration-200 border min-h-[580px] ${
              col.bgLight
            } ${
              isHovered
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20'
                : col.border
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {getStatusIcon(col.key)}
                <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {col.label}
                </h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${col.badge}`}>
                  {columnTasks.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onAddTaskInStatus(col.key)}
                title={`Adicionar tarefa em "${col.label}"`}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Column Financial Summary if > 0 */}
            {columnTotalValue > 0 && (
              <div className="mb-3 px-3 py-1.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Total pipeline:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(columnTotalValue)}
                </span>
              </div>
            )}

            {/* Tasks List */}
            <div className="flex-1 space-y-3">
              {columnTasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  onSelect={onSelectTask}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onStatusChange={onStatusChange}
                  onDragStart={handleDragStart}
                />
              ))}

              {/* Empty state per column (no dummy data) */}
              {columnTasks.length === 0 && (
                <div
                  onClick={() => onAddTaskInStatus(col.key)}
                  className="h-44 border-2 border-dashed border-slate-300 dark:border-slate-700/80 rounded-xl flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 hover:bg-white/40 dark:hover:bg-slate-900/40 transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 mb-2 transition">
                    <Plus className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Nenhuma tarefa aqui
                  </p>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Clique para criar ou arraste um card
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
