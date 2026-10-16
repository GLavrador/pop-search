# Reserva atômica de análise

Para um banco Supabase existente, execute
`20261015_atomic_analysis_reservation.sql` no SQL Editor antes de publicar
o backend desta branch. O arquivo apenas cria a função e suas permissões;
não altera nem remove registros existentes.

Para uma instalação nova, execute `backend/schema.sql`, que já inclui a função.

A chave primária de `analysis_jobs.user_id` já permite no máximo uma linha por
conta. A função usa essa restrição em um `INSERT ... ON CONFLICT` condicional:
uma análise ativa bloqueia uma nova reserva, que retorna HTTP 409. Análises
concluídas, falhas ou sem atualização há mais de dez minutos podem ser substituídas.
Uma repetição da mesma reserva mantém o identificador da tarefa.

Não é necessário adicionar um índice único parcial, pois a chave existente é
mais restritiva e preserva o modelo de uma tarefa por conta. Apenas `service_role`
pode executar a função.

Esta migração deve ser aplicada manualmente no Supabase; não há aplicação
automática durante o deploy.
