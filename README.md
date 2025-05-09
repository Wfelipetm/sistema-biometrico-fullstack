# Sistema de Cadastro e Autenticação Biométrica

Um sistema completo para cadastro e autenticação de funcionários utilizando biometria digital, com interface web, múltiplos serviços e banco de dados PostgreSQL.

## 📋 Índice

- [Visão Geral](#visao-geral)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pre-requisitos)
- [Instalação](#instalacao)


## 🔍 Visão Geral <a name="visao-geral"></a>

Este sistema oferece uma solução completa para gerenciamento de ponto eletrônico com autenticação biométrica. Ideal para empresas, instituições educacionais e órgãos públicos que necessitam de controle de acesso seguro e registro de presença confiável.

## 🏗️ Arquitetura <a name="arquitetura"></a>

O sistema é dividido em quatro componentes independentes que se comunicam entre si:

### 1. Backend Python (`backend-python/`)
- Interface gráfica e CLI para registro e identificação de digitais
- Utiliza a biblioteca **NBioBSP COM** para comunicação com o leitor biométrico
- Responsável pela captura, processamento e verificação das impressões digitais

### 2. Backend Node.js (`backend-node/`)
- API REST para comunicação com o banco de dados
- Gerenciamento de funcionários, secretarias e unidades
- Geração e envio de comprovantes por e-mail
- Upload de fotos via Multer
- Autenticação e autorização de usuários

### 3. Frontend (`frontend/`)
- Interface web responsiva para cadastro e autenticação
- Painel administrativo para gestão de usuários
- Dashboard para visualização de registros de ponto
- Desenvolvido com tecnologias web modernas

### 4. Banco de Dados (`database/`)
- Estrutura relacional em PostgreSQL
- Scripts de criação e população inicial
- Armazenamento seguro de templates biométricos

## ✨ Funcionalidades <a name="funcionalidades"></a>

- **Registro biométrico**: Cadastro de impressões digitais de funcionários
- **Autenticação segura**: Verificação de identidade por biometria
- **Registro de ponto**: Controle de entrada e saída com timestamp
- **Gestão de usuários**: Cadastro, edição e exclusão de funcionários
- **Relatórios**: Geração de relatórios de presença e ausência
- **Notificações**: Envio de comprovantes por e-mail
- **Múltiplos níveis de acesso**: Administrador, gestor e funcionário
- **Interface intuitiva**: Design simples e direto para facilitar o uso

## 🔧 Pré-requisitos <a name="pre-requisitos"></a>

- Python 3.8+ e `pip`
- Node.js 14+ e `npm`
- PostgreSQL 12+
- Biblioteca `NBioBSP COM` (fornecida pelo fabricante)
- Leitor biométrico Hamster DX FINGERTECH NITGEN
- Navegador web moderno (Chrome, Firefox, Edge)

## 📥 Instalação <a name="instalacao"></a>

### 1. Clonar o Repositório

```bash
git clone https://github.com/Wfelipetm/sistema-biometrico-fullstack.git
cd sistema-biometrico-fullstack