# Sistema de Cadastro e Autenticação Biométrica

## Visão Geral

Este projeto é um sistema completo para cadastro e autenticação de funcionários utilizando **biometria digital** e com interface web, múltiplos serviços e banco de dados PostgreSQL. A aplicação é dividida em quatro partes independentes:

- `backend-python/`: Interface gráfica e de linha de comando em Python para **registro e identificação de digitais** usando a biblioteca **NBioBSP COM**.
- `backend-node/`: API REST em Node.js responsável por toda a comunicação com o banco de dados, incluindo:
  - Cadastro de **funcionários**, **secretarias** e **unidades**, com suporte a upload de fotos via `Multer`.
  - Geração e envio de **comprovantes por e-mail** ao bater o ponto, com suporte a SMTP.
  - Endpoints RESTful organizados para facilitar a integração com o frontend.

- `frontend/`: Interface web de cadastro, autenticação e registro de ponto.
- `database/`: Scripts SQL e estrutura de banco de dados PostgreSQL.

---

## Pré-requisitos

- Python 3.x e `pip`
- Node.js e `npm`
- PostgreSQL
- Biblioteca `NBioBSP COM` 
- Leitor biométrico Hamster DX FINGERTECH NITGEN

---

## Clonar o Repositório

```bash
git clone https://github.com/Wfelipetm/sistema-biometrico-fullstack.git

---

## Clonar o Repositório

cd backend-python
pip install -r requirements.txt
python server.py  


---

---
Backend Node.js
cd backend-node
npm install
npm start

----

Frontend
cd frontend
npm install
npm run dev

----

Banco de Dados
Execute os scripts .sql na pasta database/ em seu PostgreSQL local ou servidor.

----

Funcionalidades
Registro de funcionário com biometria

Identificação por impressão digital (NBioBSP)

Registro de ponto com verificação biométrica

Interface web simples e direta

Comunicação entre backends via API REST


------



Logs e Tratamento de Erros
Todos os módulos exibem mensagens de erro e status em tempo real no console. Os serviços estão preparados para lidar com falhas de dispositivos, conexão e autenticação.


------




