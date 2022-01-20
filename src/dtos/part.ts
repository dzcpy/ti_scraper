import { Part } from '~/entities';
import { PaginatedInput, PaginatedOutput } from '~/utils';

import { InputType, ObjectType } from '@nestjs/graphql';

@InputType()
export class PartsInput extends PaginatedInput(Part) {}

@ObjectType()
export class PartsOutput extends PaginatedOutput(Part) {}
