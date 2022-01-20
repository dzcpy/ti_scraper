import { Part } from '~/entities';
import { PartService } from '~/services';

import { Resolver } from '@nestjs/graphql';

@Resolver(() => Part)
export class PartResolver {
  constructor(private readonly partservice: PartService) {}
}
