import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ironSession = require('iron-session/express').ironSession;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Spect API')
    .setDescription('The Spect API description')
    .setVersion('1.0')
    .addTag('spect')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.use(
    ironSession({
      cookieName: 'spect_circles_siwe',
      password: 'x>5#nyYdUkC?C>m>*msNZ2Hkwbb(%.<3',
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
      },
    }),
  );
  await app.listen(process.env.PORT || 8080, '0.0.0.0');
}
bootstrap();
