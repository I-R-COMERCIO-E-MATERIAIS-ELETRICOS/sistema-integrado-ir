-- Execute no SQL Editor do Supabase antes de usar o módulo Licitações.
-- Cria as tabelas e também atualiza instalações parciais/antigas.

create extension if not exists pgcrypto;

create table if not exists public.licitacoes (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid null,
  vendedor text,
  numero_pregao text not null default '',
  uasg text,
  nome_orgao text not null default '',
  cidade text,
  uf text,
  telefone text,
  email text,
  requisitos jsonb not null default '{}'::jsonb,
  banco_pagamento text,
  validade_proposta text default '60 DIAS CORRIDOS',
  prazo_entrega text default '30 DIAS CORRIDOS',
  prazo_pagamento text default '30 DIAS CORRIDOS',
  items jsonb not null default '[]'::jsonb,
  atualizado_por text,
  ultima_atualizacao timestamptz default now(),
  created_at timestamptz default now()
);

-- CREATE TABLE IF NOT EXISTS não corrige uma tabela preexistente com estrutura incompleta.
-- Estas migrações garantem que as colunas necessárias existam antes de criar o índice.
alter table public.licitacoes add column if not exists vendedor_id uuid null;
alter table public.licitacoes add column if not exists vendedor text;
alter table public.licitacoes add column if not exists numero_pregao text not null default '';
alter table public.licitacoes add column if not exists uasg text;
alter table public.licitacoes add column if not exists nome_orgao text not null default '';
alter table public.licitacoes add column if not exists cidade text;
alter table public.licitacoes add column if not exists uf text;
alter table public.licitacoes add column if not exists telefone text;
alter table public.licitacoes add column if not exists email text;
alter table public.licitacoes add column if not exists requisitos jsonb not null default '{}'::jsonb;
alter table public.licitacoes add column if not exists banco_pagamento text;
alter table public.licitacoes add column if not exists validade_proposta text default '60 DIAS CORRIDOS';
alter table public.licitacoes add column if not exists prazo_entrega text default '30 DIAS CORRIDOS';
alter table public.licitacoes add column if not exists prazo_pagamento text default '30 DIAS CORRIDOS';
alter table public.licitacoes add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.licitacoes add column if not exists atualizado_por text;
alter table public.licitacoes add column if not exists ultima_atualizacao timestamptz default now();
alter table public.licitacoes add column if not exists created_at timestamptz default now();

create index if not exists licitacoes_numero_pregao_idx on public.licitacoes (numero_pregao);

create table if not exists public.bancos (
  id uuid primary key default gen_random_uuid(),
  nome_banco text unique not null check (nome_banco in ('BANCO DO BRASIL','BRADESCO','SICOOB')),
  agencia text not null default '',
  conta_corrente text not null default '',
  updated_at timestamptz default now()
);

insert into public.bancos (nome_banco, agencia, conta_corrente)
values ('BANCO DO BRASIL','',''), ('BRADESCO','',''), ('SICOOB','','')
on conflict (nome_banco) do nothing;
