import { Product } from '~/entities';
import { ProductService } from '~/services';

import { Args, Query, Resolver } from '@nestjs/graphql';
import { ProductsInput, ProductsOutput } from '~/dtos';
import { formatPaginatedOutput } from '~/common';

@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Query(() => ProductsOutput)
  async products(@Args('paging') { limit, page = 1 }: ProductsInput) {
    const count = await this.productService.count();
    const nodes = await this.productService.find({}, { limit, offset: (page - 1) * limit });
    return formatPaginatedOutput({ count, nodes, limit, page });
  }
}
