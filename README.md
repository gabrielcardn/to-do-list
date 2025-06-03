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
* Node.js 
* npm
* Docker Engine
* Docker Compose

## Configuração do Ambiente e Instalação

Siga os passos abaixo para configurar e rodar o projeto localmente.

### 1. Clonar o Repositório (Opcional)
Se você estiver clonando este projeto de um repositório Git:
```bash
git clone <url-do-seu-repositorio-aqui>
cd <nome-da-pasta-do-projeto>