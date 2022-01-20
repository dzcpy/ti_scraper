import { Category, Part } from '~/entities';

import { Cascade, Collection, Entity, IdentifiedReference, Index, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('Product')
@Entity()
@Index({ properties: ['id', 'stock'] })
export class Product {
  @Field(() => ID)
  @PrimaryKey()
  id: string;

  @Field()
  @Property()
  name: string;

  @Field(() => Category)
  @ManyToOne({
    entity: () => Category,
    onDelete: 'CASCADE',
    onUpdateIntegrity: 'CASCADE',
    wrappedReference: true,
  })
  category: IdentifiedReference<Category>;

  @Field(() => Int)
  @Index()
  @Property()
  stock: number;

  @Field(() => [Part])
  @OneToMany({
    entity: () => Part,
    mappedBy: (part) => part.product,
    orphanRemoval: true,
    cascade: [Cascade.ALL],
  })
  parts = new Collection<Part>(this);

  @Field()
  @Index()
  @Property()
  createdAt: Date = new Date();

  @Field()
  @Index()
  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
