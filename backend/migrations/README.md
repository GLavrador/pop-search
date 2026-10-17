# Migrações

Não há aplicação automática durante o deploy: cada arquivo é executado à mão no
SQL Editor do Supabase. Para uma instalação nova, execute `backend/schema.sql`,
que já inclui todas elas.

## Aprovação de contas (`20261017_account_approval.sql`)

Execute **antes** do merge que publica o backend com a aprovação de contas.
O backend novo lê e grava as colunas `approved` e `while_pending`, e falha sem
elas. O backend anterior continua funcionando com a migração aplicada: os
vídeos que ele salva entram públicos, porque `videos.approved` tem `true` como
padrão.

O que o arquivo faz:

- `profiles.approved`: as contas existentes ficam aprovadas; as contas novas
  começam em avaliação.
- `videos.approved`: todos os vídeos existentes ficam aprovados.
- `videos_one_pending_per_user`: índice único parcial que permite no máximo um
  vídeo pendente por conta, mesmo com pedidos simultâneos.
- `usage_events.while_pending`: marca as análises feitas por contas em
  avaliação, que têm um teto diário próprio.
- Troca a política de leitura de `videos`: a chave pública só lê vídeos
  aprovados, e o dono lê também o próprio vídeo pendente.
- `approve_account(uuid)`: aprova a conta e publica o vídeo pendente dela na
  mesma transação. Só `service_role` pode executá-la.
- `match_videos`: a busca passa a considerar só vídeos aprovados.

Nenhum registro é apagado.

Para conferir depois de aplicar:

```sql
select count(*) filter (where approved) as aprovadas, count(*) as contas from profiles;
select count(*) filter (where approved) as aprovados, count(*) as videos from videos;
```

Os dois pares de números devem ser iguais.

## Reserva atômica de análise (`20261015_atomic_analysis_reservation.sql`)

Execute antes de publicar o backend que usa a função. O arquivo apenas cria a
função e suas permissões; não altera nem remove registros existentes.

A chave primária de `analysis_jobs.user_id` já permite no máximo uma linha por
conta. A função usa essa restrição em um `INSERT ... ON CONFLICT` condicional:
uma análise ativa bloqueia uma nova reserva, que retorna HTTP 409. Análises
concluídas, falhas ou sem atualização há mais de dez minutos podem ser substituídas.
Uma repetição da mesma reserva mantém o identificador da tarefa.

Não é necessário adicionar um índice único parcial, pois a chave existente é
mais restritiva e preserva o modelo de uma tarefa por conta. Apenas `service_role`
pode executar a função.
