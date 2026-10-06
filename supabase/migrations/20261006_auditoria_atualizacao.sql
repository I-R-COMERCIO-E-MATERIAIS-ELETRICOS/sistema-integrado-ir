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


-- Numeração atômica das Cotações de Frete.
-- O próximo número só é consumido no momento do salvamento.
create sequence if not exists public.cotacoes_codigo_seq;

do $$
declare
    ultimo bigint;
begin
    select coalesce(max(cast(codigo as bigint)), 0)
      into ultimo
      from public.cotacoes
     where codigo is not null
       and trim(cast(codigo as text)) ~ '^[0-9]+$';

    if ultimo = 0 then
        perform setval('public.cotacoes_codigo_seq', 1, false);
    else
        perform setval('public.cotacoes_codigo_seq', ultimo, true);
    end if;
exception when others then
    -- Se o banco já tiver dados incompatíveis com a conversão numérica,
    -- a sequence continua disponível e poderá ser inicializada manualmente.
    null;
end $$;

create or replace function public.proximo_codigo_cotacao()
returns bigint
language sql
security definer
set search_path = public
as $$
    select nextval('public.cotacoes_codigo_seq');
$$;

revoke all on function public.proximo_codigo_cotacao() from public;
grant execute on function public.proximo_codigo_cotacao() to service_role;
