import { Product, ProductHistory } from '~/entities';

import { CountOptions, DeleteOptions, EntityData, FilterQuery, FindOneOptions, FindOptions, Loaded, MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductService {
  constructor(private readonly orm: MikroORM) {}

  @UseRequestContext()
  async find<P extends string = never>(where: FilterQuery<Product> = {}, options: FindOptions<Product, P> = {}): Promise<Loaded<Product, P>[]> {
    return this.orm.em.find(Product, where, options);
  }

  @UseRequestContext()
  async findOne<P extends string = never>(where: FilterQuery<Product>, options: FindOneOptions<Product, P> = {}): Promise<Loaded<Product, P>> {
    return this.orm.em.findOne(Product, where, options);
  }

  @UseRequestContext()
  async upsert(input: EntityData<Product>, flush = true) {
    const id = input.id;
    let product = await this.orm.em.findOne(Product, { id });
    const stock = Number(input.stock);
    let changed = true;
    if (!product) {
      product = this.orm.em.create(Product, input);
      this.orm.em.persist(product);
    } else if (stock !== product.stock) {
      product.stock = stock;
    } else {
      changed = false;
    }
    if (changed) {
      await this.orm.em.persist(this.orm.em.create(ProductHistory, { product, stock }));
    }
    if (flush) {
      await this.orm.em.flush();
    }
    return product;
  }

  @UseRequestContext()
  async nativeDelete(where: FilterQuery<Product>, options: DeleteOptions<Product> = {}) {
    return this.orm.em.nativeDelete(Product, where, options);
  }

  @UseRequestContext()
  async count(where: FilterQuery<Product> = {}, options: CountOptions<Product> = {}) {
    return this.orm.em.count(Product, where, options);
  }

  @UseRequestContext()
  async exists(where: FilterQuery<Product>, options: CountOptions<Product> = {}) {
    return !!(await this.count(where, options));
  }

  @UseRequestContext()
  async flush() {
    return this.orm.em.flush();
  }
}
