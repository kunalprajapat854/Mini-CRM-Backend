import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips properties not in DTO
      forbidNonWhitelisted: true, // Throws error if extra props are sent
      transform: true, // Transforms payloads to DTO instances
    }),
  );

  // 2. Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Mini CRM API')
    .setDescription('Backend API for Users, Customers, and Tasks management.')
    .setVersion('1.0')
    .addBearerAuth() // Placeholder for Phase 2 Auth
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger Docs available at: ${await app.getUrl()}/api`);
}
bootstrap();