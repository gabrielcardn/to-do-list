#!/bin/bash

/opt/mssql/bin/sqlservr &

# Espera o SQL Server iniciar (você pode ajustar o tempo)
echo "Esperando o SQL Server iniciar..."
sleep 20s

echo "Criando o banco de dados todolist_db, se não existir..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P "$SA_PASSWORD" -C -Q "IF DB_ID('todolist_db') IS NULL CREATE DATABASE todolist_db"

# Espera o processo sqlservr terminar (evita container sair)
wait
