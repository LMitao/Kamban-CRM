import { Task, TaskStatus } from '../types/crm';
import { getSupabaseClient } from '../lib/supabase';
import { getCurrentUser } from './authService';

const LOCAL_STORAGE_KEY = 'crm_kanban_tasks_v1';

export function getAllLocalTasks(): Task[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list: Task[] = Array.isArray(parsed) ? parsed : [];
    return list.filter((t) => t.status !== 'Finalizado');
  } catch (err) {
    console.error('Erro ao ler tarefas locais:', err);
    return [];
  }
}

export function saveAllLocalTasks(tasks: Task[]) {
  try {
    const cleaned = tasks.filter((t) => t.status !== 'Finalizado');
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
  } catch (err) {
    console.error('Erro ao salvar tarefas locais:', err);
  }
}

export function getLocalTasks(userLoginOrId?: string, isOperator = false): Task[] {
  const all = getAllLocalTasks();
  if (isOperator || !userLoginOrId) {
    return all;
  }
  const cleanTarget = userLoginOrId.toLowerCase().trim();
  return all.filter((t) => {
    const taskUser = (t.created_by_login || t.created_by || '').toLowerCase().trim();
    return taskUser === cleanTarget;
  });
}

export function saveLocalTasks(tasks: Task[]) {
  saveAllLocalTasks(tasks);
}

export async function deleteFinishedTasks(userLoginOrId?: string, isOperator = false): Promise<{ count: number; error?: string }> {
  const supabase = getSupabaseClient();
  const allLocal = getAllLocalTasks();
  const finished = allLocal.filter((t) => t.status === 'Finalizado');
  const remaining = allLocal.filter((t) => t.status !== 'Finalizado');
  saveAllLocalTasks(remaining);

  if (supabase) {
    try {
      let query = supabase.from('tasks').delete().eq('status', 'Finalizado');
      if (!isOperator && userLoginOrId) {
        query = query.or(`created_by_login.eq.${userLoginOrId},created_by.eq.${userLoginOrId}`);
      }
      const { error } = await query;
      if (error) {
        return { count: finished.length, error: error.message };
      }
      return { count: finished.length };
    } catch (err: any) {
      return { count: finished.length, error: err.message };
    }
  }

  return { count: finished.length };
}

export async function fetchTasks(userLoginOrId?: string, isOperator = false): Promise<{ tasks: Task[]; source: 'supabase' | 'local'; error?: string }> {
  const supabase = getSupabaseClient();
  const cleanTarget = userLoginOrId ? userLoginOrId.toLowerCase().trim() : '';

  if (supabase) {
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      // If user is not operator and has specific login, filter by created_by_login or created_by
      if (!isOperator && cleanTarget) {
        // Query tasks belonging to this user (case insensitive or exact match)
        query = query.or(`created_by_login.ilike.${cleanTarget},created_by.ilike.${cleanTarget}`);
      }

      const { data, error } = await query;

      if (error) {
        // If column created_by_login doesn't exist yet on user's table, retry without filter and filter in JS
        const fallbackRes = await supabase
          .from('tasks')
          .select('*')
          .order('position', { ascending: true })
          .order('created_at', { ascending: false });

        if (fallbackRes.error) {
          console.warn('Erro ao carregar do Supabase, utilizando dados locais:', fallbackRes.error.message);
          return {
            tasks: getLocalTasks(userLoginOrId, isOperator),
            source: 'local',
            error: fallbackRes.error.message,
          };
        }

        const allSupabaseTasks: Task[] = (fallbackRes.data || [])
          .filter((row: any) => row.status !== 'Finalizado')
          .map((row: any) => ({
            id: String(row.id),
            title: row.title || '',
            description: row.description || '',
            status: (row.status as TaskStatus) || 'Não iniciado',
            priority: row.priority || 'Média',
            deal_value: Number(row.deal_value || 0),
            contact_name: row.contact_name || '',
            contact_email: row.contact_email || '',
            contact_phone: row.contact_phone || '',
            company_name: row.company_name || '',
            tags: Array.isArray(row.tags) ? row.tags : [],
            due_date: row.due_date || null,
            position: Number(row.position || 0),
            created_by: row.created_by || '',
            created_by_login: row.created_by_login || row.created_by || '',
            created_by_name: row.created_by_name || '',
            created_at: row.created_at || new Date().toISOString(),
            updated_at: row.updated_at || new Date().toISOString(),
          }));

        // Merge with local tasks
        saveAllLocalTasks(allSupabaseTasks);

        const scopedTasks = isOperator || !cleanTarget
          ? allSupabaseTasks
          : allSupabaseTasks.filter((t) => {
              const uLogin = (t.created_by_login || '').toLowerCase().trim();
              const uId = (t.created_by || '').toLowerCase().trim();
              return uLogin === cleanTarget || uId === cleanTarget;
            });

        return { tasks: scopedTasks, source: 'supabase' };
      }

      const tasks: Task[] = (data || [])
        .filter((row: any) => row.status !== 'Finalizado')
        .map((row: any) => ({
          id: String(row.id),
          title: row.title || '',
          description: row.description || '',
          status: (row.status as TaskStatus) || 'Não iniciado',
          priority: row.priority || 'Média',
          deal_value: Number(row.deal_value || 0),
          contact_name: row.contact_name || '',
          contact_email: row.contact_email || '',
          contact_phone: row.contact_phone || '',
          company_name: row.company_name || '',
          tags: Array.isArray(row.tags) ? row.tags : [],
          due_date: row.due_date || null,
          position: Number(row.position || 0),
          created_by: row.created_by || '',
          created_by_login: row.created_by_login || row.created_by || '',
          created_by_name: row.created_by_name || '',
          created_at: row.created_at || new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString(),
        }));

      // Cache all fetched tasks locally
      const currentAll = getAllLocalTasks();
      const otherUserTasks = currentAll.filter((t) => {
        const u = (t.created_by_login || t.created_by || '').toLowerCase().trim();
        return u !== cleanTarget;
      });
      saveAllLocalTasks([...tasks, ...otherUserTasks]);

      return { tasks, source: 'supabase' };
    } catch (err: any) {
      console.warn('Exceção ao buscar do Supabase:', err);
      return {
        tasks: getLocalTasks(userLoginOrId, isOperator),
        source: 'local',
        error: err.message,
      };
    }
  }

  return {
    tasks: getLocalTasks(userLoginOrId, isOperator),
    source: 'local',
  };
}

export async function createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<{ task: Task; source: 'supabase' | 'local'; error?: string }> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      const payload: any = {
        title: taskData.title.trim(),
        description: taskData.description || '',
        status: taskData.status,
        priority: taskData.priority,
        deal_value: taskData.deal_value || 0,
        contact_name: taskData.contact_name || '',
        contact_email: taskData.contact_email || '',
        contact_phone: taskData.contact_phone || '',
        company_name: taskData.company_name || '',
        tags: taskData.tags || [],
        due_date: taskData.due_date || null,
        position: taskData.position || 0,
        created_at: now,
        updated_at: now,
      };

      if (taskData.created_by) payload.created_by = taskData.created_by;
      if (taskData.created_by_login) payload.created_by_login = taskData.created_by_login;
      if (taskData.created_by_name) payload.created_by_name = taskData.created_by_name;

      let createdRecord: any = null;
      const { data, error } = await supabase
        .from('tasks')
        .insert([payload])
        .select()
        .single();

      if (error) {
        // If created_by_login doesn't exist on schema, retry without it
        if (error.message.includes('created_by_login')) {
          delete payload.created_by_login;
          const retry = await supabase.from('tasks').insert([payload]).select().single();
          if (retry.error) throw new Error(retry.error.message);
          createdRecord = retry.data;
        } else {
          throw new Error(error.message);
        }
      } else {
        createdRecord = data;
      }

      const created: Task = {
        id: String(createdRecord.id),
        title: createdRecord.title,
        description: createdRecord.description || '',
        status: createdRecord.status,
        priority: createdRecord.priority,
        deal_value: Number(createdRecord.deal_value || 0),
        contact_name: createdRecord.contact_name || '',
        contact_email: createdRecord.contact_email || '',
        contact_phone: createdRecord.contact_phone || '',
        company_name: createdRecord.company_name || '',
        tags: Array.isArray(createdRecord.tags) ? createdRecord.tags : [],
        due_date: createdRecord.due_date || null,
        position: Number(createdRecord.position || 0),
        created_by: createdRecord.created_by || taskData.created_by,
        created_by_login: createdRecord.created_by_login || taskData.created_by_login || taskData.created_by,
        created_by_name: createdRecord.created_by_name || taskData.created_by_name,
        created_at: createdRecord.created_at,
        updated_at: createdRecord.updated_at,
      };

      const allLocal = getAllLocalTasks();
      saveAllLocalTasks([created, ...allLocal]);

      return { task: created, source: 'supabase' };
    } catch (err: any) {
      console.error('Falha ao salvar no Supabase, salvando localmente:', err);
      // Fallback local
      const fallbackTask: Task = {
        id: crypto.randomUUID ? crypto.randomUUID() : `local_${Date.now()}`,
        ...taskData,
        created_at: now,
        updated_at: now,
      };
      const allLocal = getAllLocalTasks();
      saveAllLocalTasks([fallbackTask, ...allLocal]);
      return { task: fallbackTask, source: 'local', error: err.message };
    }
  }

  // Local storage only
  const localTask: Task = {
    id: crypto.randomUUID ? crypto.randomUUID() : `local_${Date.now()}`,
    ...taskData,
    created_at: now,
    updated_at: now,
  };
  const allLocal = getAllLocalTasks();
  saveAllLocalTasks([localTask, ...allLocal]);
  return { task: localTask, source: 'local' };
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  // Update in localStorage first for instant responsiveness
  const currentAll = getAllLocalTasks();
  const updatedAll = currentAll.map((t) =>
    t.id === id ? { ...t, ...updates, updated_at: now } : t
  );
  saveAllLocalTasks(updatedAll);

  if (supabase) {
    try {
      const payload: any = {
        updated_at: now,
      };

      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.deal_value !== undefined) payload.deal_value = updates.deal_value;
      if (updates.contact_name !== undefined) payload.contact_name = updates.contact_name;
      if (updates.contact_email !== undefined) payload.contact_email = updates.contact_email;
      if (updates.contact_phone !== undefined) payload.contact_phone = updates.contact_phone;
      if (updates.company_name !== undefined) payload.company_name = updates.company_name;
      if (updates.tags !== undefined) payload.tags = updates.tags;
      if (updates.due_date !== undefined) payload.due_date = updates.due_date;
      if (updates.position !== undefined) payload.position = updates.position;

      const { error } = await supabase.from('tasks').update(payload).eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

export async function deleteTask(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();

  const currentAll = getAllLocalTasks();
  const filtered = currentAll.filter((t) => t.id !== id);
  saveAllLocalTasks(filtered);

  if (supabase) {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

export async function migrateLocalTasksToSupabase(userLoginOrId?: string, isOperator = false): Promise<{ count: number; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { count: 0, error: 'Supabase não está configurado.' };
  }

  const localTasks = getLocalTasks(userLoginOrId, isOperator);
  if (localTasks.length === 0) {
    return { count: 0 };
  }

  try {
    const payload = localTasks.map((task) => ({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      deal_value: task.deal_value || 0,
      contact_name: task.contact_name || '',
      contact_email: task.contact_email || '',
      contact_phone: task.contact_phone || '',
      company_name: task.company_name || '',
      tags: task.tags || [],
      due_date: task.due_date || null,
      position: task.position || 0,
      created_by: task.created_by || '',
      created_by_login: task.created_by_login || '',
      created_by_name: task.created_by_name || '',
    }));

    const { data, error } = await supabase.from('tasks').insert(payload).select();

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: data ? data.length : payload.length };
  } catch (err: any) {
    return { count: 0, error: err.message };
  }
}
