-- Enable extensions
create extension if not exists "pgcrypto";

-- Enums
create type public.org_role as enum ('owner', 'admin', 'office', 'planner', 'technician', 'viewer');
create type public.quote_status as enum ('draft', 'sent', 'accepted', 'rejected', 'expired');
create type public.order_status as enum ('draft', 'confirmed', 'scheduled', 'in_progress', 'completed', 'invoiced', 'closed');
create type public.work_status as enum ('assigned', 'on_route', 'started', 'blocked', 'done', 'signed');
create type public.invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');

-- Core tables
create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null,
  role public.org_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  email text not null,
  role public.org_role not null,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  type text not null default 'business',
  email text,
  phone text,
  billing_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text not null,
  address text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  site_id uuid references public.sites(id),
  number text not null,
  status public.quote_status not null default 'draft',
  valid_until date,
  notes text,
  discount numeric(10,2) not null default 0,
  tax_rate numeric(5,2) not null default 21,
  total numeric(12,2) not null default 0,
  margin numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  line_type text not null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  cost_price numeric(12,2) not null default 0,
  spec jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  quote_id uuid references public.quotes(id),
  customer_id uuid not null references public.customers(id),
  site_id uuid references public.sites(id),
  number text not null,
  status public.order_status not null default 'draft',
  delivery_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  line_type text not null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  cost_price numeric(12,2) not null default 0,
  spec jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  order_id uuid references public.orders(id),
  site_id uuid references public.sites(id),
  assigned_to uuid,
  scheduled_date date not null,
  status public.work_status not null default 'assigned',
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  work_task_id uuid not null references public.work_tasks(id) on delete cascade,
  status public.work_status not null default 'assigned',
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_measurements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  label text not null,
  width_mm integer not null,
  height_mm integer not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_checklist_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  label text not null,
  is_checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_photos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  storage_path text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_signatures (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  signer_name text not null,
  signature_svg text not null,
  signed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  order_id uuid references public.orders(id),
  number text not null,
  status public.invoice_status not null default 'draft',
  issued_on date,
  due_on date,
  total numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 21,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  export_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  storage_path text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.orgs(id) on delete cascade,
  tax_rate numeric(5,2) not null default 21,
  currency text not null default 'EUR',
  quote_prefix text not null default 'Q',
  order_prefix text not null default 'O',
  invoice_prefix text not null default 'INV',
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products_glass_catalog (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  name text not null,
  spec jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.price_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index on public.org_members (org_id, user_id);
create index on public.customers (org_id, name);
create index on public.quotes (org_id, status);
create index on public.orders (org_id, status);
create index on public.work_tasks (org_id, scheduled_date, assigned_to);
create index on public.invoices (org_id, status);

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.next_document_number(prefix text, org_id uuid)
returns text
language plpgsql as $$
declare
  sequence_value bigint;
begin
  execute format('create sequence if not exists %I', prefix || '_' || org_id);
  execute format('select nextval(%L)', prefix || '_' || org_id) into sequence_value;
  return prefix || '-' || to_char(now(), 'YYYY') || '-' || lpad(sequence_value::text, 4, '0');
end;
$$;

create or replace function public.assign_quote_number()
returns trigger
language plpgsql as $$
begin
  if new.number is null or new.number = '' then
    new.number := public.next_document_number('Q', new.org_id);
  end if;
  return new;
end;
$$;

create or replace function public.assign_order_number()
returns trigger
language plpgsql as $$
begin
  if new.number is null or new.number = '' then
    new.number := public.next_document_number('O', new.org_id);
  end if;
  return new;
end;
$$;

create or replace function public.assign_invoice_number()
returns trigger
language plpgsql as $$
begin
  if new.number is null or new.number = '' then
    new.number := public.next_document_number('INV', new.org_id);
  end if;
  return new;
end;
$$;

create or replace function public.audit_log_trigger()
returns trigger
language plpgsql as $$
begin
  insert into public.audit_log (org_id, entity_type, entity_id, action, actor_id, payload)
  values (new.org_id, tg_table_name, new.id, tg_op, auth.uid(), to_jsonb(new));
  return new;
end;
$$;

create trigger set_updated_at_orgs before update on public.orgs
for each row execute function public.set_updated_at();
create trigger set_updated_at_org_members before update on public.org_members
for each row execute function public.set_updated_at();
create trigger set_updated_at_invites before update on public.invites
for each row execute function public.set_updated_at();
create trigger set_updated_at_customers before update on public.customers
for each row execute function public.set_updated_at();
create trigger set_updated_at_customer_contacts before update on public.customer_contacts
for each row execute function public.set_updated_at();
create trigger set_updated_at_sites before update on public.sites
for each row execute function public.set_updated_at();
create trigger set_updated_at_quotes before update on public.quotes
for each row execute function public.set_updated_at();
create trigger set_updated_at_quote_lines before update on public.quote_lines
for each row execute function public.set_updated_at();
create trigger set_updated_at_orders before update on public.orders
for each row execute function public.set_updated_at();
create trigger assign_quote_number before insert on public.quotes
for each row execute function public.assign_quote_number();
create trigger assign_order_number before insert on public.orders
for each row execute function public.assign_order_number();
create trigger assign_invoice_number before insert on public.invoices
for each row execute function public.assign_invoice_number();
create trigger set_updated_at_order_lines before update on public.order_lines
for each row execute function public.set_updated_at();
create trigger set_updated_at_work_tasks before update on public.work_tasks
for each row execute function public.set_updated_at();
create trigger set_updated_at_work_orders before update on public.work_orders
for each row execute function public.set_updated_at();
create trigger set_updated_at_work_measurements before update on public.work_measurements
for each row execute function public.set_updated_at();
create trigger set_updated_at_work_checklist_items before update on public.work_checklist_items
for each row execute function public.set_updated_at();
create trigger set_updated_at_work_photos before update on public.work_photos
for each row execute function public.set_updated_at();
create trigger set_updated_at_work_signatures before update on public.work_signatures
for each row execute function public.set_updated_at();
create trigger set_updated_at_invoices before update on public.invoices
for each row execute function public.set_updated_at();
create trigger set_updated_at_invoice_lines before update on public.invoice_lines
for each row execute function public.set_updated_at();
create trigger set_updated_at_exports before update on public.exports
for each row execute function public.set_updated_at();
create trigger set_updated_at_attachments before update on public.attachments
for each row execute function public.set_updated_at();
create trigger set_updated_at_settings before update on public.settings
for each row execute function public.set_updated_at();
create trigger set_updated_at_products_glass_catalog before update on public.products_glass_catalog
for each row execute function public.set_updated_at();
create trigger set_updated_at_price_rules before update on public.price_rules
for each row execute function public.set_updated_at();

create trigger audit_log_quotes after insert or update on public.quotes
for each row execute function public.audit_log_trigger();
create trigger audit_log_orders after insert or update on public.orders
for each row execute function public.audit_log_trigger();
create trigger audit_log_invoices after insert or update on public.invoices
for each row execute function public.audit_log_trigger();
create trigger audit_log_exports after insert on public.exports
for each row execute function public.audit_log_trigger();
create trigger audit_log_work_orders after insert or update on public.work_orders
for each row execute function public.audit_log_trigger();
create trigger audit_log_customers after insert or update on public.customers
for each row execute function public.audit_log_trigger();
create trigger audit_log_sites after insert or update on public.sites
for each row execute function public.audit_log_trigger();
create trigger audit_log_work_tasks after insert or update on public.work_tasks
for each row execute function public.audit_log_trigger();

-- Helper functions for RLS
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql stable as $$
  select exists(
    select 1 from public.org_members
    where org_members.org_id = is_org_member.org_id
      and org_members.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(org_id uuid, roles text[])
returns boolean
language sql stable as $$
  select exists(
    select 1 from public.org_members
    where org_members.org_id = has_org_role.org_id
      and org_members.user_id = auth.uid()
      and org_members.role = any(roles)
  );
$$;

-- RLS
alter table public.orgs enable row level security;
alter table public.org_members enable row level security;
alter table public.invites enable row level security;
alter table public.customers enable row level security;
alter table public.customer_contacts enable row level security;
alter table public.sites enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_lines enable row level security;
alter table public.orders enable row level security;
alter table public.order_lines enable row level security;
alter table public.work_tasks enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_measurements enable row level security;
alter table public.work_checklist_items enable row level security;
alter table public.work_photos enable row level security;
alter table public.work_signatures enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.exports enable row level security;
alter table public.attachments enable row level security;
alter table public.audit_log enable row level security;
alter table public.settings enable row level security;
alter table public.products_glass_catalog enable row level security;
alter table public.price_rules enable row level security;

create policy org_member_select on public.orgs
  for select using (public.is_org_member(id));
create policy org_member_select on public.org_members
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.invites
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.customers
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.customer_contacts
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.sites
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.quotes
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.quote_lines
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.orders
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.order_lines
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.work_tasks
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.work_orders
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.work_measurements
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.work_checklist_items
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.work_photos
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.work_signatures
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.invoices
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.invoice_lines
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.exports
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.attachments
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.audit_log
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.settings
  for select using (public.is_org_member(org_id));
create policy org_member_select on public.products_glass_catalog
  for select using (public.is_org_member(org_id) or org_id is null);
create policy org_member_select on public.price_rules
  for select using (public.is_org_member(org_id));

create policy org_member_write on public.customers
  for insert with check (public.has_org_role(org_id, array['owner','admin','office','planner']));
create policy org_member_write on public.customers
  for update using (public.has_org_role(org_id, array['owner','admin','office','planner']));
create policy org_member_write on public.customers
  for delete using (public.has_org_role(org_id, array['owner','admin','office','planner']));

create policy org_member_write on public.orders
  for insert with check (public.has_org_role(org_id, array['owner','admin','office','planner']));
create policy org_member_write on public.orders
  for update using (public.has_org_role(org_id, array['owner','admin','office','planner']));
create policy org_member_write on public.orders
  for delete using (public.has_org_role(org_id, array['owner','admin','office','planner']));

create policy org_member_write on public.quotes
  for insert with check (public.has_org_role(org_id, array['owner','admin','office','planner']));
create policy org_member_write on public.quotes
  for update using (public.has_org_role(org_id, array['owner','admin','office','planner']));
create policy org_member_write on public.quotes
  for delete using (public.has_org_role(org_id, array['owner','admin','office','planner']));

create policy org_member_write on public.exports
  for insert with check (public.has_org_role(org_id, array['owner','admin','office','planner']));

create policy org_member_write on public.work_orders
  for update using (
    public.has_org_role(org_id, array['owner','admin','office','planner'])
    or exists (
      select 1 from public.work_tasks
      where work_tasks.id = work_orders.work_task_id
        and work_tasks.assigned_to = auth.uid()
    )
  );

create policy technician_work_tasks on public.work_tasks
  for select using (
    public.has_org_role(org_id, array['owner','admin','office','planner','technician'])
    and (assigned_to = auth.uid() or public.has_org_role(org_id, array['owner','admin','office','planner']))
  );

create policy technician_work_tasks_update on public.work_tasks
  for update using (
    assigned_to = auth.uid() or public.has_org_role(org_id, array['owner','admin','office','planner'])
  );

create policy technician_work_orders_select on public.work_orders
  for select using (
    public.has_org_role(org_id, array['owner','admin','office','planner','technician'])
    and exists (
      select 1 from public.work_tasks
      where work_tasks.id = work_orders.work_task_id
        and work_tasks.assigned_to = auth.uid()
    )
  );

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('org-files', 'org-files', false)
on conflict do nothing;

create policy \"org files read\" on storage.objects
  for select using (
    bucket_id = 'org-files'
    and public.is_org_member((split_part(name, '/', 1))::uuid)
  );

drop policy if exists \"org files write\" on storage.objects;

create policy \"org files write\" on storage.objects
  for insert with check (
    bucket_id = 'org-files'
    and (
      public.has_org_role((split_part(name, '/', 1))::uuid, array['owner','admin','office','planner'])
      or exists (
        select 1
        from public.work_orders
        join public.work_tasks on work_tasks.id = work_orders.work_task_id
        where work_orders.id = (split_part(name, '/', 3))::uuid
          and work_tasks.assigned_to = auth.uid()
      )
    )
  );

-- Seed data
insert into public.products_glass_catalog (org_id, name, spec)
values
  (null, 'HR++', '{"type":"insulated"}'),
  (null, 'Triple', '{"type":"triple"}'),
  (null, 'Gelaagd', '{"type":"laminated"}'),
  (null, 'Gehard', '{"type":"tempered"}'),
  (null, 'Vacuum', '{"type":"vacuum"}'),
  (null, 'Zonwerend', '{"type":"solar"}'),
  (null, 'Geluidswerend', '{"type":"acoustic"}');

create view public.report_revenue_monthly as
  select org_id, to_char(date_trunc('month', issued_on), 'YYYY-MM') as month, sum(total) as total
  from public.invoices
  group by org_id, date_trunc('month', issued_on);

create view public.report_open_invoices as
  select org_id, count(*) as count
  from public.invoices
  where status <> 'paid'
  group by org_id;

create view public.report_hit_rate as
  select
    quotes.org_id,
    count(distinct quotes.id) as quote_count,
    count(distinct orders.id) as order_count,
    case when count(distinct quotes.id) = 0 then 0 else count(distinct orders.id)::decimal / count(distinct quotes.id) end as hit_rate
  from public.quotes
  left join public.orders on orders.quote_id = quotes.id
  group by quotes.org_id;
