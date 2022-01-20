import { Product } from '~/entities';

import { Cascade, Collection, Entity, Index, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('Category')
@Entity()
export class Category {
  @Field(() => ID)
  @PrimaryKey()
  id: string;

  @Field()
  @Property()
  key: string;

  @Field({ nullable: true })
  @Property({ nullable: true })
  name: string;

  @Field(() => [Product])
  @OneToMany({
    entity: () => Product,
    mappedBy: (product) => product.category,
    orphanRemoval: true,
    cascade: [Cascade.ALL],
  })
  products = new Collection<Product>(this);

  @Field()
  @Index()
  @Property()
  createdAt: Date = new Date();
}

export const CATEGORIES_REDIS_KEY = 'categories';
