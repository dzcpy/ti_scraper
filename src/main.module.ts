import { resolve } from 'path';
import { EnvSettings, MikroOrmConfig } from '~/settings';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
// import {} from '~/resolvers';
// import {} from '~/services';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RedisModule } from '@nestjs-modules/ioredis';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';

import { PartResolver, ProductResolver } from '~/resolvers';
import { PartService, ProductService, CategoryService, WorkerService } from '~/services';

const debug = EnvSettings.isDevelopment;

const redisOptions = {
  host: EnvSettings.REDIS_HOST,
  port: EnvSettings.REDIS_PORT,
};

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      debug,
      playground: debug,
      introspection: debug,
      context: ({ req }) => ({ ...req }),
      autoSchemaFile: resolve(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      cors: {
        credentials: true,
        origin: true,
      },
      // https://mikro-orm.io/docs/usage-with-nestjs/#request-scoping-when-using-graphql
      bodyParserConfig: false,
    }),
    MikroOrmModule.forRoot(MikroOrmConfig),
    BullModule.forRoot({ redis: redisOptions }),
    RedisModule.forRoot({ config: redisOptions }),
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [ProductService, ProductResolver, PartService, PartResolver, CategoryService, WorkerService],
  exports: [],
})
export class MainModule {}
