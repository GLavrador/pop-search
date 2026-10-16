# Pop Search: frontend

Interface em React e TypeScript, com Vite, TanStack Query e Supabase Auth.
Use Node.js 22.12+ e configure `.env` a partir de [`.env.example`](.env.example).
A instalação do backend e do banco está no [README principal](../README.md).

```bash
npm ci
npm run dev
```

O servidor local usa `/api` como proxy para o backend em `http://127.0.0.1:8000`.
Em produção, configure `VITE_API_URL` antes do build.

| Script | Uso |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run lint` | ESLint |
| `npm run build` | Verificação TypeScript e build em `dist/` |
| `npm run test -- --run` | Executa a suíte uma vez |
| `npm run test` | Testes em modo de observação |
| `npm run preview` | Prévia local do build |

Em `src/`, `components/` reúne a interface e seus CSS Modules; `hooks/` contém
queries e comportamentos; `context/` contém os estados compartilhados;
`services/` contém o cliente da API; `schemas/` contém validações;
`i18n/` contém os textos em português e inglês; `assets/` contém imagens.
Os testes ficam junto dos componentes e módulos que verificam.
