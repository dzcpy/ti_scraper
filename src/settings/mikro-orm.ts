import * as entityExports from '~/entities';
import { EnvSettings } from '~/settings';

import { EntityName, LoadStrategy } from '@mikro-orm/core';
import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

const entities = Object.values(entityExports).filter((EntityClass: any) => EntityClass?.name) as EntityName<any>[];

const debug = EnvSettings.isDevelopment;

export default {
  entities,
  highlighter: debug ? new SqlHighlighter() : undefined,
  debug,
  validate: debug,
  strict: debug,
  autoJoinOneToOneOwner: false,
  autoLoadEntities: true,
  loadStrategy: LoadStrategy.JOINED,
  migrations: {
    path: 'database/migration',
  },
} as MikroOrmModuleSyncOptions;
