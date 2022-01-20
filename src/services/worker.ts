import axios, { AxiosProxyConfig } from 'axios';
import { load } from 'cheerio';
import { convert } from 'html-to-text';
import { find } from 'lodash';
import { setTimeout } from 'node:timers/promises';
import { createContext, runInContext } from 'node:vm';
import pMap from 'p-map';
import UserAgent from 'user-agents';
import XRegExp from 'xregexp';
import { CATEGORIES_REDIS_KEY, Part } from '~/entities';
import { CategoryService, PartService, ProductService } from '~/services';
import { EnvSettings } from '~/settings';
import { validateStatus } from '~/utils';

import { FilterQuery, wrap } from '@mikro-orm/core';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

const { TI_HOMEPAGE_URL, PROXY_ENABLED, PROXY_HOST, PROXY_PORT, PROXY_USERNAME, PROXY_PASSWORD } = EnvSettings;

const PROXY_AXIOS: AxiosProxyConfig = {
  host: PROXY_HOST,
  port: Number(PROXY_PORT),
  auth: PROXY_USERNAME && PROXY_PASSWORD ? { username: PROXY_USERNAME, password: PROXY_PASSWORD } : undefined,
};

const TI_CATALOG_URL_PREFIX = TI_HOMEPAGE_URL + '/selectiontool/paramdata/family/';
const TI_CATALOG_URL_SUFFIX = '/results';

const TI_PRODUCTS_URL_PREFIX = TI_HOMEPAGE_URL + '/';
const TI_PRODUCTS_URL_SUFFIX = '/products.html';

const TI_PARTS_URL_PREFIX = TI_HOMEPAGE_URL + '/productmodel/';
const TI_PARTS_URL_SUFFIX = '/tistore';

const TI_PRICE_URL = TI_HOMEPAGE_URL + `/popularorderables/addtocart/${/ti\.com\.cn/.test(TI_HOMEPAGE_URL) ? 'zh-CN' : 'en'}/PF`;

const defaultRequestHeaders = {
  'User-Agent': new UserAgent({ deviceCategory: 'desktop' }).toString(),
  Connection: 'keep-alive',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'same-origin',
  Referer: TI_HOMEPAGE_URL,
  Origin: TI_HOMEPAGE_URL,
  Pragma: 'no-cache',
};

@Injectable()
export class WorkerService implements OnModuleInit {
  constructor(
    private readonly productService: ProductService,
    private readonly partService: PartService,
    private readonly categoryService: CategoryService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  async updateCategories() {
    const { data } = await axios.get(TI_HOMEPAGE_URL, {
      proxy: PROXY_ENABLED ? PROXY_AXIOS : false,
      headers: {
        Cookie: 'pf-accept-language=zh-CN',
      },
    });

    const $ = load(data);

    const categories = await pMap(
      $('li a.js-megaMenu-level-1:not([href*=/applications/])')
        .toArray()
        .map((dom) => ({ key: XRegExp.match($(dom).attr('href'), /(?<=\/)[a-z-_]*?(?=\/overview.html)/) as string, name: convert($(dom).html()) }))
        .filter((obj) => obj.key),
      async ({ name, key }) => {
        let result = await axios.get(TI_PRODUCTS_URL_PREFIX + key + TI_PRODUCTS_URL_SUFFIX, {
          headers: { ...defaultRequestHeaders },
          proxy: PROXY_ENABLED ? PROXY_AXIOS : false,
          validateStatus,
          maxRedirects: 0,
        });
        if (result.status > 300 && result.headers.location) {
          result = await axios.get(result.headers.location, {
            headers: { ...defaultRequestHeaders },
            proxy: PROXY_ENABLED ? PROXY_AXIOS : false,
          });
        }

        const $ = load(result.data);
        const id = runInContext($('script:contains("tiProductPathID")').html(), createContext())?.replace(/[^\d]/g, '');

        if (!id) {
          return;
        }

        await this.categoryService.upsert({ id, key, name });
      },
      { concurrency: 5 },
    );

    if (!categories.length) {
      throw new Error('Fetching categories failed');
    }
    // this.redis.set(CATEGORIES_REDIS_KEY, JSON.stringify(categories));
    return categories;
  }

  async updateProducts(lang = 'cn') {
    const categories = JSON.parse(await this.redis.get(CATEGORIES_REDIS_KEY));
    await pMap(
      categories,
      async ({ id: categoryId }) => {
        const { data } = await axios.get(TI_CATALOG_URL_PREFIX + categoryId + TI_CATALOG_URL_SUFFIX, {
          params: { lang, output: 'json' },
          headers: {
            ...defaultRequestHeaders,
            'Content-Type': 'application/json',
            Accept: '*/*',
          },
          proxy: PROXY_ENABLED ? PROXY_AXIOS : undefined,
        });
        await pMap(
          data?.ParametricResults || [],
          async ({ o1: id, o3: name, p3318: stock }) => {
            stock = Number(stock);
            const category = await this.categoryService.getReference(categoryId);
            const product = await this.productService.upsert({ id, name, stock, category });
            const { data } = await axios.get(TI_PARTS_URL_PREFIX + id + TI_PARTS_URL_SUFFIX, {
              params: { lang, output: 'json' },
              headers: {
                ...defaultRequestHeaders,
                'Content-Type': 'application/json',
                Referer: TI_HOMEPAGE_URL + '/product/' + id,
                Accept: '*/*',
              },
              proxy: PROXY_ENABLED ? PROXY_AXIOS : undefined,
            });
            for (const { orderablePartNumber: id, inventory: stock } of data) {
              if (stock === undefined) {
                await this.partService.upsert({ id, stock: 0, product, active: false });
              } else {
                await this.partService.upsert({ id, stock: Number(stock), product });
              }
            }
            await setTimeout(400);
          },
          { concurrency: 1 },
        );
        await setTimeout(1000);
      },
      { concurrency: 1 },
    );
  }

  async updatePrice(init = false) {
    const parts = await this.partService.find(init ? { price1: null } : {});
    console.log(parts.length);
    await pMap(
      parts,
      async (part) => {
        const { data } = await axios.get(TI_PRICE_URL, {
          params: { opn: part.id },
          headers: {
            ...defaultRequestHeaders,
            'Content-Type': 'application/json',
            Accept: '*/*',
          },
          proxy: PROXY_ENABLED ? PROXY_AXIOS : undefined,
        });
        const priceList = data.tiered_price_list;
        const price1 = Number(find(find(priceList, { range_from: '1' })?.price_list ?? [], { currency: 'USD' })?.currency_price) || null;
        const price100 = Number(find(find(priceList, { range_from: '100' })?.price_list ?? [], { currency: 'USD' })?.currency_price) || null;
        const price250 = Number(find(find(priceList, { range_from: '250' })?.price_list ?? [], { currency: 'USD' })?.currency_price) || null;
        const price1000 = Number(find(find(priceList, { range_from: '1000' })?.price_list ?? [], { currency: 'USD' })?.currency_price) || null;
        if (price1 === part.price1 && price100 === part.price100 && price250 === part.price250 && price1000 === part.price1000) {
          return;
        }
        await this.partService.upsert({ ...wrap(part).toPOJO(), price1, price100, price250, price1000 }, true, true);
      },
      { concurrency: 1 },
    );
  }
  async exportCSV(where: FilterQuery<Part> = {}) {
    const parts = await this.partService.find(where, { populate: ['product.name', 'product.category.name'] });
    const headers = ['编号', '名称', '类别', '库存', '价格(1pc)', '价格(100pcs)', '价格(250pcs)', '价格(1000+pcs)'];
    return [
      headers.join(','),
      ...parts.map((part) =>
        [
          part.id,
          '"' + (part as any).product.name + '"',
          (part as any).product.category.name,
          part.stock,
          part.price1,
          part.price100,
          part.price250,
          part.price1000,
        ].join(','),
      ),
    ].join('\n');
  }

  async onModuleInit() {
    // await this.updateCategories();
    // await this.updateProducts();
    // await this.updatePrice(true);
  }
}
