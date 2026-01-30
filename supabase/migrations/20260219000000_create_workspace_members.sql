create table if not exists public.workspace_members (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    role text default 'member' check (role in ('owner', 'admin', 'member', 'coach')),
    created_at timestamptz default now(),
    unique(workspace_id, user_id)
);

-- Enable RLS
alter table public.workspace_members enable row level security;

-- Policies
create policy "Users can view members of their workspaces"
    on public.workspace_members for select
    using (
        workspace_id in (
            select workspace_id from public.workspace_members where user_id = auth.uid()
        )
        or
        -- Allow viewing members if you own the workspace (implied by workspaces.user_id if that exists, but let's stick to membership)
        -- Fallback: if you are the workspace owner in workspaces table
        workspace_id in (
            select id from public.workspaces where user_id = auth.uid()
        )
    );

create policy "Workspace owners can insert members"
    on public.workspace_members for insert
    with check (
        workspace_id in (
            select id from public.workspaces where user_id = auth.uid()
        )
    );

create policy "Workspace owners can update members"
    on public.workspace_members for update
    using (
        workspace_id in (
            select id from public.workspaces where user_id = auth.uid()
        )
    );

create policy "Workspace owners can delete members"
    on public.workspace_members for delete
    using (
        workspace_id in (
            select id from public.workspaces where user_id = auth.uid()
        )
    );
