import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: (process.env.DB_TYPE as any) || 'mssql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '14333'),
  username: process.env.DB_USERNAME || 'sa',
  password: process.env.DB_PASSWORD || 'yourStrong(!)Password123',
  database: process.env.DB_DATABASE || 'todolist_db',
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/src/migrations/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,

  extra: {
    trustServerCertificate: true,
  },
};

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
