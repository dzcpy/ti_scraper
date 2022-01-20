import { Part } from '~/entities';
import { PaginatedInput, PaginatedOutput } from '~/common';

import { InputType, ObjectType } from '@nestjs/graphql';

@InputType()
export class PartsInput extends PaginatedInput(Part) {}

@ObjectType()
export class PartsOutput extends PaginatedOutput(Part) {}
