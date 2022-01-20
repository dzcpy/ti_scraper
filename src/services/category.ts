import { Category } from '~/entities';

import { CountOptions, DeleteOptions, EntityData, FilterQuery, FindOneOptions, FindOptions, Loaded, MikroORM, UseRequestContext, wrap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CategoryService {
  constructor(private readonly orm: MikroORM) {}

  @UseRequestContext()
  async find<P extends string = never>(where: FilterQuery<Category> = {}, options: FindOptions<Category, P> = {}): Promise<Loaded<Category, P>[]> {
    return this.orm.em.find(Category, where, options);
  }

  @UseRequestContext()
  async findOne<P extends string = never>(where: FilterQuery<Category>, options: FindOneOptions<Category, P> = {}): Promise<Loaded<Category, P>> {
    return this.orm.em.findOne(Category, where, { orderBy: { createdAt: -1 }, ...options });
  }

  @UseRequestContext()
  async upsert(input: EntityData<Category>, flush = true) {
    const id = input.id;
    let category = await this.orm.em.findOne(Category, { id });
    if (!category) {
      category = this.orm.em.create(Category, input);
      this.orm.em.persist(category);
    } else if (input.key && input.name) {
      wrap(category).assign(input);
    }
    if (flush) {
      await this.orm.em.flush();
    }
    return category;
  }

  @UseRequestContext()
  async nativeDelete(where: FilterQuery<Category>, options: DeleteOptions<Category> = {}) {
    return this.orm.em.nativeDelete(Category, where, options);
  }

  @UseRequestContext()
  async count(where: FilterQuery<Category> = {}, options: CountOptions<Category> = {}) {
    return this.orm.em.count(Category, where, options);
  }

  @UseRequestContext()
  async exists(where: FilterQuery<Category>, options: CountOptions<Category> = {}) {
    return !!(await this.count(where, options));
  }

  @UseRequestContext()
  async getReference(id: string) {
    return this.orm.em.getReference(Category, id);
  }

  @UseRequestContext()
  async flush() {
    return this.orm.em.flush();
  }
}
