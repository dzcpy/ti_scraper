import { Part } from '~/entities';

import { Entity, IdentifiedReference, Index, ManyToOne, PrimaryKey, PrimaryKeyType, Property } from '@mikro-orm/core';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('PartHistory')
@Entity()
export class PartHistory {
  @Field(() => String)
  @ManyToOne({
    entity: () => Part,
    onDelete: 'CASCADE',
    onUpdateIntegrity: 'CASCADE',
    primary: true,
  })
  part: IdentifiedReference<Part>;

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
