import { json } from 'express';

import { NestFactory } from '@nestjs/core';

import { MainModule } from './main.module';
import { EnvSettings } from './settings';

async function bootstrap() {
  // https://mikro-orm.io/docs/usage-with-nestjs/#request-scoping-when-using-graphql
  const app = await NestFactory.create(MainModule, { bodyParser: false });
  app.use(json());
  await app.listen(EnvSettings.SERVER_PORT);
}
bootstrap();
