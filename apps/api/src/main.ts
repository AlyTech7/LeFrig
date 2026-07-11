import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

function parseCorsOrigins(raw: string | undefined): boolean | string[] {
  if (!raw || raw.trim() === '*') return true;
  const origins = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return origins.length > 0 ? origins : true;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  const uploadDir = config.get('UPLOAD_DIR', join(process.cwd(), 'uploads'));
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });

  app.enableCors({
    origin: parseCorsOrigins(config.get<string>('CORS_ORIGINS')),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const enableSwagger = config.get('ENABLE_SWAGGER', 'true') !== 'false';
  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('LeFrig API')
      .setDescription('Superapp saharaui — marketplace, efectivo, fiado, transporte, diáspora')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = config.get<number>('API_PORT', 3001);
  await app.listen(port);
  console.log(`🚀 LeFrig API running on http://localhost:${port}`);
  if (enableSwagger) {
    console.log(`📚 Swagger docs at http://localhost:${port}/docs`);
  }
}

bootstrap();
