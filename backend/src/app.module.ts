// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
// As importações diretas de TasksController e TasksService podem ser removidas
// se não forem mais usadas aqui após as correções.

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.getOrThrow<string>('DB_TYPE');
        const dbHost = configService.getOrThrow<string>('DB_HOST');
        const dbPort = configService.getOrThrow<string>('DB_PORT');
        const dbUsername = configService.getOrThrow<string>('DB_USERNAME');
        const dbPassword = configService.getOrThrow<string>('DB_PASSWORD');
        const dbDatabase = configService.getOrThrow<string>('DB_DATABASE');

        return {
          type: dbType as any,
          host: dbHost,
          port: parseInt(dbPort),
          username: dbUsername,
          password: dbPassword,
          database: dbDatabase,
          entities: [__dirname + '/../**/*.entity.js'], // Seu ajuste aqui
          synchronize: true,
          options: {
            encrypt: false,
            trustServerCertificate: true,
          },
          logging: true,
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    TasksModule, // TasksModule já disponibiliza TasksService e TasksController
  ],
  controllers: [AppController], // Remova TasksController daqui
  providers: [AppService],    // Remova TasksService daqui
})
export class AppModule {}