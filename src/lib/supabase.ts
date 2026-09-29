import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'crm_supabase_url';
const STORAGE_KEY_KEY = 'crm_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getStoredSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const storedUrl = localStorage.getItem(STORAGE_KEY_URL)?.trim() || '';
  const storedKey = localStorage.getItem(STORAGE_KEY_KEY)?.trim() || '';

  return {
    url: storedUrl || envUrl,
    anonKey: storedKey || envKey,
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (cleanUrl) {
    localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
  }

  if (cleanKey) {
    localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
  } else {
    localStorage.removeItem(STORAGE_KEY_KEY);
  }

  cachedClient = null;
  cachedUrl = '';
  cachedKey = '';
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseCredentials();

  if (!url || !anonKey) {
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedUrl = url;
    cachedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Erro ao inicializar Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string; tableExists?: boolean }> {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (!cleanUrl || !cleanKey) {
    return { success: false, message: 'URL e Chave Anon são obrigatórias.' };
  }

  if (!cleanUrl.startsWith('https://') || !cleanUrl.includes('supabase.co')) {
    return { success: false, message: 'URL do Supabase inválida. Deve começar com https:// e conter .supabase.co' };
  }

  try {
    const testClient = createClient(cleanUrl, cleanKey);
    // Tenta consultar a tabela tasks
    const { data, error } = await testClient.from('tasks').select('id').limit(1);

    if (error) {
      // Se o erro for de tabela inexistente (código 42P01 no postgres)
      if (error.code === '42P01' || error.message.includes('relation "public.tasks" does not exist') || error.message.includes('tasks')) {
        return {
          success: true,
          tableExists: false,
          message: 'Conectado com sucesso ao Supabase! Porém a tabela "tasks" ainda não foi criada. Execute o script SQL abaixo no SQL Editor do Supabase.',
        };
      }
      return {
        success: false,
        message: `Erro do Supabase: ${error.message}`,
      };
    }

    return {
      success: true,
      tableExists: true,
      message: 'Conexão estabelecida com sucesso! A tabela "tasks" está pronta.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha na conexão: ${err.message || 'Verifique as credenciais e tente novamente.'}`,
    };
  }
}

export const SUPABASE_SQL_SETUP = `-- ============================================================
-- SCRIPT DE CRIAÇÃO DA TABELA TASKS PARA O CRM KANBAN
-- Cole este script no SQL Editor do seu painel Supabase e clique em RUN
-- ============================================================

-- 1. Cria a tabela de tarefas/negócios
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  status text not null check (status in ('Não iniciado', 'Em Andamento', 'Finalizado')),
  priority text not null default 'Média',
  deal_value numeric default 0,
  contact_name text default '',
  contact_email text default '',
  contact_phone text default '',
  company_name text default '',
  tags text[] default array[]::text[],
  due_date timestamptz,
  position integer default 0,
  created_by text default '',
  created_by_login text default '',
  created_by_name text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Se a tabela ja existia, adiciona as colunas caso ainda nao existam:
alter table public.tasks add column if not exists created_by text default '';
alter table public.tasks add column if not exists created_by_login text default '';
alter table public.tasks add column if not exists created_by_name text default '';

-- 2. Habilita Row Level Security (RLS)
alter table public.tasks enable row level security;

-- 3. Cria política para permitir leitura, inserção, atualização e exclusão com a chave pública (anon)
drop policy if exists "Permitir acesso total para anon" on public.tasks;
create policy "Permitir acesso total para anon"
  on public.tasks
  for all
  using (true)
  with check (true);

-- 4. Ativar Realtime para a tabela tasks (apenas se ainda não estiver adicionada)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;
end $$;
`;
