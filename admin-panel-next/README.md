# CMEX Admin Panel

Este é o painel administrativo para gerenciar os serviços do CMEX (CMercio EXterno).

## Configuração dos Serviços

O painel gerencia os seguintes serviços:

| Serviço        | Porta | Descrição                               |
| -------------- | ----- | --------------------------------------- |
| Redis          | 6378  | Banco de dados em memória para cache    |
| FastAPI        | 10000 | Backend Python com FastAPI              |
| Node.js        | 3001  | Servidor Node.js para busca inteligente |
| Frontend React | 5173  | Interface web em React                  |
| Admin Panel    | 3003  | O próprio painel administrativo         |

## Como Usar

Para iniciar o painel administrativo, execute o script:

```bash
./start-admin.sh
```

Este script:

1. Limpa processos existentes nas portas utilizadas
2. Inicia o painel administrativo na porta 3003
3. Abre automaticamente o navegador

## Funcionalidades

- **Verificação de Status**: Monitora se cada serviço está em execução
- **Iniciar/Parar Serviços**: Controle individual de cada serviço
- **Logs em Tempo Real**: Visualize os logs de execução de cada serviço
- **Limpeza de Portas**: Remove processos que possam estar bloqueando as portas
- **Reinicialização de Serviços**: Reinicie serviços com um clique

## Solução de Problemas

Se encontrar problemas ao iniciar os serviços:

1. Verifique se as portas não estão sendo usadas por outros processos
2. Use o botão "Limpar Porta" para forçar a liberação da porta
3. Certifique-se de que os diretórios dos serviços existem
4. Verifique os logs para mensagens de erro detalhadas

## Implementação

Este painel foi desenvolvido com:

- **Next.js**: Framework React para a interface
- **Server Actions**: Execução de comandos no servidor
- **Styled Components**: Estilização dos componentes
- **child_process**: Execução de comandos do sistema
- **Monitoramento em Tempo Real**: Verificação periódica do status dos serviços

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
