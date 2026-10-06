-- Auditoria da última atualização nos módulos de Cotações de Frete e Ordens de Compra.
-- Execute este arquivo no SQL Editor do Supabase antes de publicar a nova versão.

alter table if exists public.cotacoes
    add column if not exists atualizado_por text;

alter table if exists public.ordens_compra
    add column if not exists ultima_atualizacao timestamptz;

alter table if exists public.ordens_compra
    add column if not exists atualizado_por text;

-- Não altera registros históricos automaticamente: eles permanecem sem auditoria
-- até que sejam criados/editados/status alterado pela nova aplicação.
