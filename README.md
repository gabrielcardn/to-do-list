# Projeto Completo: Sistema de Gerenciamento de Tarefas (To-Do List)

Este projeto é uma aplicação web fullstack para gerenciamento de tarefas, desenvolvida para demonstrar habilidades em desenvolvimento backend com Node.js (NestJS) e frontend com React. A aplicação permite que usuários se registrem, façam login e gerenciem suas tarefas pessoais.

## Funcionalidades Implementadas

* **Autenticação de Usuários:**
    * Registro de novos usuários com nome de usuário e senha.
    * Login de usuários existentes.
    * Autenticação baseada em JSON Web Tokens (JWT).
    * Armazenamento seguro de senhas usando bcrypt.
* **Gerenciamento de Tarefas (para usuários autenticados):**
    * Criar novas tarefas com título e descrição.
    * Listar todas as tarefas do usuário logado, com paginação.
    * Visualizar detalhes de uma tarefa específica.
    * Atualizar os detalhes de uma tarefa (título, descrição, status).
    * Marcar uma tarefa como concluída, pendente ou em progresso.
    * Remover tarefas.
* **Persistência de Dados:**
    * Uso do SQL Server como banco de dados.
    * Banco de dados rodando em um container Docker.
    * Esquema do banco de dados gerenciado por migrations TypeORM.
* **Testes:**
    * Testes unitários para os serviços e controllers do backend (NestJS).
    * Testes unitários para os serviços e componentes principais do frontend (React).

## Tecnologias Utilizadas

**Backend:**
* Node.js (v18.x ou superior recomendado)
* NestJS (Framework TypeScript para Node.js)
* TypeORM (ORM para TypeScript/JavaScript)
* SQL Server (Banco de dados relacional)
* Docker e Docker Compose (Para o ambiente de banco de dados)
* JSON Web Tokens (JWT) para autenticação (`@nestjs/jwt`)
* `passport`, `passport-jwt` para estratégias de autenticação
* `bcrypt` para hashing de senhas
* `class-validator` e `class-transformer` para validação de DTOs
* Jest (Para testes unitários)

**Frontend:**
* React (v18.x ou superior recomendado)
* Vite (Ferramenta de build e servidor de desenvolvimento)
* TypeScript
* React Router DOM (Para roteamento de páginas)
* `fetch` API (Nativa do navegador, para chamadas HTTP)
* Vitest (Para testes unitários)
* React Testing Library (Para testes de componentes React)
* CSS (Estilização básica inline e, opcionalmente, via `App.css`)

**Banco de Dados:**
* Microsoft SQL Server (rodando em Docker)

## Pré-requisitos

Antes de começar, garanta que você tem as seguintes ferramentas instaladas e configuradas no seu sistema:

* Node.js (versão 18.x ou mais recente é recomendada)
* npm (v8.x ou mais recente, geralmente vem com o Node.js)
* Docker Engine
* Docker Compose
* Git (para clonar o repositório)

## Configuração do Ambiente e Instalação

Siga os passos abaixo para configurar e rodar o projeto localmente.

### 1. Clonar o Repositório (Opcional)

Se você estiver clonando este projeto de um repositório Git (substitua pela URL correta):
```bash
git clone github.com/gabrielcardn/to-do-list/
```

### 2. Configurar Variáveis de Ambiente

Crie arquivos .env para o backend e para o frontend baseados nos exemplos abaixo. Estes arquivos são cruciais para configurar a conexão com o banco de dados, segredos de JWT, e outras informações específicas do ambiente.

#### a. Backend (backend/.env)
Navegue até a pasta backend e crie um arquivo .env com o seguinte conteúdo.
⚠️ Importante: Substitua os valores de placeholder (especialmente DB_PASSWORD e JWT_SECRET) por valores seguros e adequados ao seu ambiente

backend/.env

# Configurações do Banco de Dados
```
DB_TYPE=mssql
DB_HOST=localhost
DB_PORT=1433 # Ou a porta que você configurou para o SQL Server no docker-compose.yml (ex: 1433 se for a padrão)
DB_USERNAME=sa
DB_PASSWORD=yourStrong(!)Password123 # !!! SUBSTITUA PELA SUA SENHA FORTE DO USUÁRIO SA DO SQL SERVER !!!
DB_DATABASE=todolist_db
```

# Configurações do JWT
```
JWT_SECRET=!!!SuaChaveSuperSecretaMuitoForteAquiPeloMenos32Caracteres!!! # !!! GERE UM SEGREDO FORTE E ÚNICO !!!
JWT_EXPIRATION_TIME=3600s # Tempo de expiração do token (ex: 1 hora = 3600s, 1 dia = 1d)
```

#### b. Frontend (frontend/.env)

frontend/.env

Navegue até a frontend e crie um arquivo .env para especificar a URL base da API do backend:

```
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Configurar e Iniciar o Banco de Dados (SQL Server com Docker)
O banco de dados SQL Server é gerenciado pelo Docker Compose para facilitar a configuração e portabilidade.

Navegue até a pasta do backend:
```
cd backend
```

Verifique o docker-compose.yml: Confirme se a variável SA_PASSWORD dentro da seção environment do serviço sqlserver no arquivo docker-compose.yml corresponde à DB_PASSWORD que você definiu no arquivo .env do backend.

Inicie o container do SQL Server: Este comando também executará o script para criar o banco de dados todolist_db se ele não existir.
```
docker-compose up -d
```

Aguarde alguns instantes para o SQL Server inicializar completamente. Você pode verificar os logs com docker-compose logs -f sqlserver.

### 4. Instalar Dependências e Rodar Migrations (Backend)

Ainda na pasta backend:

```
npm install
```

Após a instalação das dependências e com o banco de dados Docker rodando, aplique as migrations para criar as tabelas (users, tasks, typeorm_migrations):
```
npm run migration:run
```

Nota: Se esta for a primeira vez configurando as migrations em um banco de dados completamente limpo (e você já tem a configuração data-source.ts e a pasta src/migrations com uma migration inicial, como a InitialSchema), este comando criará a estrutura das tabelas. Se você não gerou uma migration inicial ainda, você precisaria executar npm run migration:generate src/migrations/[NomeDaSuaMigrationInicial] antes.

### 5. Instalar Dependências (Frontend)

Navegue até a pasta do frontend:

```
npm install
```

## Como Executar o Projeto

Após completar a configuração e instalação das dependências para o backend e o frontend, você precisará de dois terminais abertos para rodar a aplicação completa.

### 1. Executar o Backend (NestJS)

1.  No seu terminal, navegue até a pasta raiz do projeto backend:
    ```
    cd caminho/para/seu-projeto/backend
    ```
2.  Inicie o servidor de desenvolvimento do NestJS:
    ```
    npm run start:dev
    ```
    O servidor backend iniciará e estará escutando na porta configurada (geralmente `http://localhost:3000`, conforme definido no `src/main.ts` do backend). Você verá logs no terminal indicando que a aplicação NestJS foi iniciada.

### 2. Executar o Frontend (React)

1.  Em um **novo terminal**, navegue até a pasta raiz do projeto frontend:
2.  Inicie o servidor de desenvolvimento do Vite para a aplicação React:
    ```
    npm run dev
    ```
    A aplicação React será compilada e servida. O terminal indicará o endereço para acessá-la no navegador (geralmente `http://localhost:5173` ou outra porta similar).
3.  Abra o endereço do frontend fornecido no seu navegador para interagir com a aplicação.

## Executando os Testes

O projeto inclui testes unitários para garantir a qualidade e o correto funcionamento dos módulos do backend e dos componentes/serviços do frontend.

### Testes Unitários do Backend (NestJS com Jest)

1.  Navegue até a pasta raiz do projeto backend:
2.  Execute os seguintes comandos para os testes:
    * Para rodar todos os testes unitários uma vez:
      ```
      npm run test
      ```
    * Para rodar os testes em modo de observação (watch mode), que re-executa os testes automaticamente ao detectar alterações nos arquivos:
      ```
      npm run test:watch
      ```
    * Para rodar os testes e gerar um relatório de cobertura de código:
      ```
      npm run test:cov
      ```
    * Para rodar um arquivo de teste específico (substitua pelo caminho do arquivo):
      ```
      npm run test -- src/auth/auth.service.spec.ts
      ```

### Testes Unitários do Frontend (React com Vitest)

1.  Navegue até a pasta raiz do projeto frontend:
    ```
    cd caminho/para/seu-projeto/frontend
    ```
2.  Execute os seguintes comandos para os testes:
    * Para rodar todos os testes unitários uma vez no terminal:
      ```
      npm run test
      ```
    * Para abrir a interface gráfica do Vitest no navegador, que permite uma execução e visualização interativa dos testes:
      ```
      npm run test:ui
      ```
    * Para rodar um arquivo de teste específico (substitua pelo caminho do arquivo):
      ```
      npm run test -- src/pages/LoginPage.test.tsx
      ```

## Endpoints da API (Resumo)

A API do backend fornece os seguintes endpoints. Todos os endpoints de `/tasks` são protegidos e requerem um token JWT válido no cabeçalho `Authorization: Bearer <token>`. A URL base da API é `http://localhost:3000` (ou o que estiver configurado).

* **Autenticação (`/auth`)**
    * `POST /auth/register`: Registra um novo usuário.
        * Corpo da Requisição: `{ "username": "seu_usuario", "password": "sua_senha" }`
        * Resposta de Sucesso (201): `{ "id": "uuid-do-usuario", "username": "seu_usuario" }`
    * `POST /auth/login`: Autentica um usuário existente e retorna um token JWT.
        * Corpo da Requisição: `{ "username": "seu_usuario", "password": "sua_senha" }`
        * Resposta de Sucesso (200): `{ "access_token": "seu_jwt_token_aqui" }`

* **Tarefas (`/tasks`)**
    * `POST /tasks`: Cria uma nova tarefa para o usuário autenticado.
        * Corpo da Requisição: `{ "title": "Título da Tarefa", "description": "Descrição opcional da tarefa" }`
        * Resposta de Sucesso (201): Retorna o objeto da tarefa criada.
    * `GET /tasks`: Lista as tarefas do usuário autenticado com paginação.
        * Parâmetros de Query (opcionais): `?page=1&limit=10`
        * Resposta de Sucesso (200): `{ "data": [...tarefas], "total": numero_total_de_tarefas, "page": pagina_atual, "limit": limite_por_pagina }`
    * `GET /tasks/:id`: Obtém os detalhes de uma tarefa específica (do usuário autenticado) pelo seu ID.
        * Resposta de Sucesso (200): Retorna o objeto da tarefa.
    * `PATCH /tasks/:id`: Atualiza detalhes de uma tarefa existente (título, descrição e/ou status).
        * Corpo da Requisição: `{ "title": "Novo Título", "description": "Nova Descrição", "status": "DONE" }` (todos os campos são opcionais).
        * Resposta de Sucesso (200): Retorna o objeto da tarefa atualizada.
    * `PATCH /tasks/:id/status`: Atualiza especificamente o status de uma tarefa.
        * Corpo da Requisição: `{ "status": "DONE" }` (valores válidos: `PENDING`, `IN_PROGRESS`, `DONE`)
        * Resposta de Sucesso (200): Retorna o objeto da tarefa atualizada.
    * `DELETE /tasks/:id`: Remove uma tarefa do usuário autenticado.
        * Resposta de Sucesso (204): Sem conteúdo no corpo da resposta.

#### Mínimo para rodar
# To-Do List - Instruções Rápidas de Execução

## 1. Criar os arquivos `.env`

### backend/.env

DB_TYPE=mssql  
DB_HOST=localhost  
DB_PORT=1433  
DB_USERNAME=sa  
DB_PASSWORD=YourStrong(!)Password123  
DB_DATABASE=todolist_db  
JWT_SECRET=SuaChaveSuperSecretaForteCom32+Caracteres  
JWT_EXPIRATION_TIME=3600s  

### frontend/.env

VITE_API_BASE_URL=http://localhost:3000

---

## 2. Subir o banco de dados com Docker

```bash
cd backend
docker-compose up -d
```

---

## 3. Instalar dependências e rodar migrations

### Backend

```bash
cd backend
npm install
npm run migration:run
```

### Frontend

```bash
cd ../frontend
npm install
```

---

## 4. Rodar a aplicação

### Backend

```bash
cd backend
npm run start:dev
```

### Frontend (em outro terminal)

```bash
cd frontend
npm run dev
```

---

## 5. Acessar no navegador

Frontend: [http://localhost:5173](http://localhost:5173)  
Backend: [http://localhost:3000](http://localhost:3000)
