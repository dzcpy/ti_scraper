import { Product } from '~/entities';
import { PaginatedInput, PaginatedOutput } from '~/utils';

import { InputType, ObjectType } from '@nestjs/graphql';

@InputType()
export class ProductsInput extends PaginatedInput(Product) {}

@ObjectType()
export class ProductsOutput extends PaginatedOutput(Product) {}
