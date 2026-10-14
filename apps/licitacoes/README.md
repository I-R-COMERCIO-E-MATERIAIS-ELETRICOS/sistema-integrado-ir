# Módulo Licitações

O módulo é servido em `/licitacoes` e utiliza as APIs `/api/licitacoes` e `/api/licitacoes-bancos`.

## Ativação no Supabase
1. Abra o SQL Editor do projeto Supabase.
2. Execute todo o arquivo `schema.sql` desta pasta. Ele cria `public.licitacoes` e `public.bancos`, com os registros iniciais dos três bancos.
3. Na tabela `profiles`, conceda o app `licitacoes` aos usuários que devem acessar o módulo. Administradores têm acesso automaticamente.
4. Abra o módulo pelo Portal. O vendedor lista administradores e usuários ativos que têm acesso ao módulo.
5. No botão **Dados bancários**, preencha agência e conta corrente de cada banco. Esses dados são inseridos na proposta conforme o banco selecionado no cadastro.

## Documentos
- **PROPOSTA PDF** e **COMP. EXEQUIBILIDADE** abrem uma página de impressão; escolha “Salvar como PDF” no diálogo do navegador.
- **PROPOSTA DOCS** baixa um documento `.doc` editável no Microsoft Word, inclusive a tabela de itens.

Os itens são armazenados como JSONB na licitação, com cálculo automático de estimado total, custo total, venda unitária (custo × 1,49) e venda total.
