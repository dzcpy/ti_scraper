import { Product } from '~/entities';

import { Entity, IdentifiedReference, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('Part')
@Entity()
export class Part {
  @Field(() => ID)
  @PrimaryKey()
  id: string;

  @Field({ nullable: true })
  @Property({ type: 'float', nullable: true })
  price1: number;

  @Field({ nullable: true })
  @Property({ type: 'float', nullable: true })
  price100: number;

  @Field({ nullable: true })
  @Property({ type: 'float', nullable: true })
  price250: number;

  @Field({ nullable: true })
  @Property({ type: 'float', nullable: true })
  price1000: number;

  // @Field(() => Int)
  // @Property()
  // packageQty: number;

  // @Field()
  // @Property()
  // carrier: string;

  @Field(() => Int)
  @Index()
  @Property()
  stock: number;

  @Field(() => Product)
  @ManyToOne({
    entity: () => Product,
    onDelete: 'CASCADE',
    onUpdateIntegrity: 'CASCADE',
    wrappedReference: true,
  })
  product: IdentifiedReference<Product>;

  @Field(() => Boolean)
  @Property({ type: 'bool', default: true })
  active = true;

  @Field()
  @Index()
  @Property()
  createdAt: Date = new Date();

  @Field()
  @Index()
  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
