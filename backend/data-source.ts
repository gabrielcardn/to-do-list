// meu-projeto-backend/data-source.ts
import 'reflect-metadata'; // Necessário para o TypeORM
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv'; // Para carregar variáveis do .env

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Define as opções de configuração. É importante que sejam as mesmas
// que você usa no AppModule para a conexão principal.
export const dataSourceOptions: DataSourceOptions = {
  type: process.env.DB_TYPE as any || 'mssql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '14333'), // Use a porta correta
  username: process.env.DB_USERNAME || 'sa',
  password: process.env.DB_PASSWORD || 'yourStrong(!)Password123', // Use sua senha correta
  database: process.env.DB_DATABASE || 'todolist_db',
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'], // Caminho para suas entidades
  migrations: [__dirname + '/src/migrations/*{.ts,.js}'], // Caminho para seus arquivos de migration
  migrationsTableName: 'typeorm_migrations', // Nome da tabela que guarda o histórico de migrations
  synchronize: false, // DEVE ser false para usar migrations
  // Opções específicas do MSSQL (se necessário, como no AppModule)
  extra: {
    trustServerCertificate: true, // Se estiver usando certificado autoassinado em dev
  },
  // logging: true, // Pode habilitar para ver as queries do CLI
};

// Exporta uma instância do DataSource
const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;