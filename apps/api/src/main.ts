import './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { isSwaggerEnabled } from './common/config/production-security';

function parseCorsOrigins(raw: string | undefined, isProd: boolean): boolean | string[] {
  const trimmed = raw?.trim();
  if (isProd) {
    if (!trimmed || trimmed === '*') {
      throw new Error(
        'CORS_ORIGINS must be an explicit comma-separated allowlist in production (refusing * / empty)',
      );
    }
  }
  if (!trimmed || trimmed === '*') return true;
  const origins = trimmed
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    if (isProd) {
      throw new Error('CORS_ORIGINS parsed to an empty list');
    }
    return true;
  }
  return origins;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  const config = app.get(ConfigService);
  const isProd = config.get('NODE_ENV') === 'production';

  const uploadDir = config.get('UPLOAD_DIR', join(process.cwd(), 'uploads'));
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });

  app.enableCors({
    origin: parseCorsOrigins(config.get<string>('CORS_ORIGINS'), isProd),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const enableSwagger = isSwaggerEnabled(config);
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

  const port = Number(config.get('PORT') ?? config.get('API_PORT', 3001));
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 LeFrig API running on http://localhost:${port}`);
  if (enableSwagger) {
    console.log(`📚 Swagger docs at http://localhost:${port}/docs`);
  }
}

bootstrap();
