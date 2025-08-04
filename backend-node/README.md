# Backend Node.js

Este serviço é responsável pela API REST, gerenciamento de funcionários, secretarias, unidades, autenticação e envio de comprovantes por e-mail.

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure as variáveis de ambiente em um arquivo `.env`.
3. Inicie o servidor:
   ```bash
   npm start
   ```

## Principais comandos
- `npm run dev`: Inicia o servidor em modo desenvolvimento
- `npm start`: Inicia o servidor em modo produção

## Estrutura
- `src/`: Código-fonte principal
- `upload/`: Pasta para uploads de arquivos

## Requisitos
- Node.js 14+
- Banco de dados PostgreSQL

## Observação
Consulte o README.md principal para detalhes de integração com os outros módulos.
