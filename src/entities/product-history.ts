import { Product } from '~/entities';

import { Entity, IdentifiedReference, Index, ManyToOne, PrimaryKey, PrimaryKeyType, Property } from '@mikro-orm/core';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('ProductHistory')
@Entity()
export class ProductHistory {
  @Field(() => String)
  @ManyToOne({
    entity: () => Product,
    onDelete: 'CASCADE',
    onUpdateIntegrity: 'CASCADE',
    primary: true,
    wrappedReference: true,
  })
  product: IdentifiedReference<Product>;

  @Field(() => Int)
  @Index()
  @Property()
  stock: number;

  @Field()
  @PrimaryKey()
  @Property()
  createdAt: Date = new Date();

  [PrimaryKeyType]: [string, Date];
}
