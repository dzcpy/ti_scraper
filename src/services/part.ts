import { Part } from '~/entities';

import { CountOptions, DeleteOptions, EntityData, FilterQuery, FindOneOptions, FindOptions, Loaded, MikroORM, UseRequestContext, wrap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { PartHistory } from '~/entities';

@Injectable()
export class PartService {
  constructor(private readonly orm: MikroORM) {}

  @UseRequestContext()
  async find<P extends string = never>(where: FilterQuery<Part> = {}, options: FindOptions<Part, P> = {}): Promise<Loaded<Part, P>[]> {
    return this.orm.em.find(Part, where, options);
  }

  @UseRequestContext()
  async findOne<P extends string = never>(where: FilterQuery<Part>, options: FindOneOptions<Part, P> = {}): Promise<Loaded<Part, P>> {
    return this.orm.em.findOne(Part, where, options);
  }

  @UseRequestContext()
  async upsert(input: EntityData<Part>, flush = true, update = false) {
    const id = input.id;
    let part = await this.orm.em.findOne(Part, { id });
    const stock = Number(input.stock);
    let changed = true;
    if (!part) {
      part = this.orm.em.create(Part, input);
      this.orm.em.persist(part);
    } else if (stock !== part.stock) {
      part.stock = stock;
    } else if (typeof input.active == 'boolean' && part.active !== input.active) {
      part.active = input.active;
    } else if (
      typeof input.price1 === 'number' &&
      (input.price1 !== part.price1 || input.price100 !== part.price100 || input.price250 !== part.price250 || input.price1000 !== part.price1000)
    ) {
      wrap<Part>(part).assign(input);
    } else {
      changed = false;
    }
    if (changed) {
      if (update) {
        await this.orm.em.nativeUpdate(
          PartHistory,
          { part },
          {
            part,
            stock,
            price1: input.price1 || null,
            price250: input.price250 || null,
            price100: input.price100 || null,
            price1000: input.price1000 || null,
          },
        );
      } else {
        await this.orm.em.persist(
          this.orm.em.create(PartHistory, {
            part,
            stock,
            price1: input.price1 || null,
            price250: input.price250 || null,
            price100: input.price100 || null,
            price1000: input.price1000 || null,
          }),
        );
      }
    }
    if (flush) {
      await this.orm.em.flush();
    }
    return part;
  }

  @UseRequestContext()
  async nativeDelete(where: FilterQuery<Part>, options: DeleteOptions<Part> = {}) {
    return this.orm.em.nativeDelete(Part, where, options);
  }

  @UseRequestContext()
  async count(where: FilterQuery<Part>, options: CountOptions<Part> = {}) {
    return this.orm.em.count(Part, where, options);
  }

  @UseRequestContext()
  async exists(where: FilterQuery<Part>, options: CountOptions<Part> = {}) {
    return !!(await this.count(where, options));
  }

  @UseRequestContext()
  async flush() {
    return this.orm.em.flush();
  }
}
