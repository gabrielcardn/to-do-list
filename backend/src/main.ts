// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Importe ValidationPipe

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // Configura o ValidationPipe globalmente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades que não estão no DTO
      forbidNonWhitelisted: true, // Lança erro se propriedades não listadas forem enviadas
      transform: true, // Transforma o payload para instâncias de DTO (ex: string para number)
      transformOptions: {
        enableImplicitConversion: true, // Permite conversão implícita baseada nos tipos do DTO
      },
    }),
  );

  await app.listen(3000);
}
bootstrap();