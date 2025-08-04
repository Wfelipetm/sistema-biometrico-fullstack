# Executável Quiosque (Electron)

Este módulo é responsável por rodar o sistema em modo quiosque, bloqueando teclado, mouse, navegação e exibindo uma tela offline caso a conexão caia.

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o aplicativo Electron:
   ```bash
   npm start
   ```

## Funcionalidades
- Modo quiosque seguro (fullscreen, bloqueio de teclas e navegação)
- Carrega a URL principal do sistema
- Exibe tela offline se perder conexão
- Retorna automaticamente quando a internet volta

## Requisitos
- Node.js 14+
- Electron

## Observação
Consulte o README.md principal para detalhes de integração com o backend e frontend.
