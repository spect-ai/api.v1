import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ironSession = require('iron-session/express').ironSession;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Spect API')
    .setDescription('Spect API playground')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tagSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Spect API',
    customfavIcon:
      'https://spect.infura-ipfs.io/ipfs/QmcBLdB23dQkXdMKFHAjVKMKBPJF82XkqR5ZkxyCk6aset',
  });
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.use(
    ironSession({
      cookieName: 'spect_circle',
      password: process.env.IRON_SESSION_COOKIE_PASSWORD,
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        domain:
          process.env.NODE_ENV === 'production' ? 'spect.network' : undefined,
      },
    }),
  );
  // app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  await app.listen(process.env.PORT || 8080, '0.0.0.0');
}
bootstrap();
