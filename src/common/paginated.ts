import { IsInt, IsNotEmpty, Max, Min, ValidateIf } from 'class-validator';

import { AnyEntity, EntityName, Loaded, Utils } from '@mikro-orm/core';
import { Field, InputType, ObjectType } from '@nestjs/graphql';

export const PaginatedInput = <T extends AnyEntity<T>>(Entity: EntityName<T>, maxLimit = 50) => {
  const className = typeof Entity === 'string' ? Entity : Utils.className(Entity);

  @InputType(`Paginated${className}sInput`)
  abstract class PaginatedInput {
    @Field()
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Max(maxLimit)
    limit: number;

    @Field({ nullable: true, defaultValue: 1 })
    @ValidateIf((obj) => obj.hasOwnProperty('page'))
    @IsInt()
    @Min(1)
    page?: number;
  }

  return PaginatedInput;
};

export const PaginatedOutput = <T extends AnyEntity<T>>(Entity: EntityName<T>) => {
  const className = typeof Entity === 'string' ? Entity : Utils.className(Entity);

  @ObjectType(`Paginated${className}sOutput`, { isAbstract: true })
  abstract class PaginatedOutput {
    @Field(() => [Entity])
    nodes: Loaded<T, never>[];

    @Field()
    totalCount: number;

    @Field()
    nodesPerPage: number;

    @Field()
    PageCount: number;

    @Field()
    currentPage: number;
  }

  return PaginatedOutput;
};

export const formatPaginatedOutput = <T extends AnyEntity<T>>({
  count,
  nodes,
  limit,
  page,
}: {
  count: number;
  nodes: Loaded<T, never>[];
  limit: number;
  page: number;
}) => {
  return {
    totalCount: count,
    nodes,
    nodesPerPage: limit,
    currentPage: page,
    pageCount: Math.ceil(count / limit),
  };
};
