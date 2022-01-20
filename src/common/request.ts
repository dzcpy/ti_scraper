import { curly, HeaderInfo } from 'node-libcurl';
import { stringify } from 'node:querystring';
import { createBrotliDecompress, createUnzip } from 'node:zlib';
import streamToPromise from 'stream-to-promise';
import { ProxyAgent, request as undici } from 'undici';

import type { IncomingHttpHeaders } from 'node:http';
import type { JsonValue } from 'type-fest';
import type { Dispatcher } from 'undici';

const convertReqHeaders = (headers: Record<string, string>) => Object.entries(headers).map(([key, value]) => key + ': ' + value);
const convertResHeaders = (headers: HeaderInfo) => {
  const resHeaders: IncomingHttpHeaders = {};
  Object.entries(headers).forEach(([key, value]) => {
    if (typeof value !== 'string' && !Array.isArray(value)) {
      return;
    }
    resHeaders[key.toLocaleLowerCase()] = value;
  });
  return resHeaders;
};

export type RequestOptionsType = {
  method?: 'GET' | 'POST';
  body?: JsonValue;
  query?: Record<string, string>;
  proxy?: false | string;
  cookies?: string | Record<string, string>;
  headers?: Record<string, string>;
  maxRedirects?: number;
  timeout?: number;
  driver?: 'undici' | 'curly';
};

export type RequestReturnType = {
  data: any;
  headers: IncomingHttpHeaders;
  statusCode: number;
};

export const request = async (
  url: string,
  { method = 'GET', body, query = {}, proxy, cookies, headers: reqHeaders = {}, maxRedirects = 3, timeout, driver = 'curly' }: RequestOptionsType = {},
): Promise<RequestReturnType> => {
  const urlObj = new URL(url);
  if (typeof query === 'object') {
    urlObj.search = `?${stringify(
      Object.assign(
        {},
        Array.from(urlObj.searchParams.entries()).reduce((prev, [key, value]) => Object.assign(prev, { [key]: value }), {}),
        query,
      ),
    )}`;
  }
  const cookieString = cookies
    ? typeof cookies === 'string'
      ? cookies
      : Object.entries(cookies)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ')
    : undefined;
  switch (driver) {
    case 'undici': {
      if (cookieString) {
        if (reqHeaders.cookie) {
          reqHeaders.cookie = cookieString;
        } else {
          reqHeaders.Cookie = cookieString;
        }
      }
      const options: { dispatcher?: Dispatcher } & Omit<Dispatcher.RequestOptions, 'origin' | 'path'> = {
        ...(proxy ? { dispatcher: new ProxyAgent(proxy) } : {}),
        method,
        headers: reqHeaders,
        maxRedirections: maxRedirects,
      };
      if (timeout > 0) {
        options.headersTimeout = timeout;
      }
      const { statusCode, body, headers } = await undici(urlObj, options);
      let data: any;
      switch (headers['content-encoding']) {
        case 'br':
          data = await streamToPromise(body.pipe(createBrotliDecompress()));
          break;
        case 'gzip':
        case 'deflate':
          data = await streamToPromise(body.pipe(createUnzip()));
          break;
        default:
          data = await streamToPromise(body);
          break;
      }
      data = /application\/json/.test(headers?.['content-type']) ? JSON.parse(data) : data.toString('utf-8');
      return {
        data,
        headers,
        statusCode,
      };
    }
    case 'curly': {
      const client = method === 'GET' ? curly.get : method === 'POST' ? curly.post : undefined;
      if (!client) {
        return;
      }
      let postFields: string | undefined;
      if (body) {
        if (typeof body === 'string') {
          postFields = body;
        } else {
          if (
            !Object.keys(reqHeaders)
              .map((key) => key.toLocaleLowerCase())
              .includes('content-type')
          ) {
            reqHeaders['Content-Type'] = 'application/json';
          }
          postFields = JSON.stringify(body);
        }
      }
      const { statusCode, data, headers } = await client(urlObj.href, {
        ...(proxy ? { proxy } : {}),
        ...(postFields ? { postFields } : {}),
        httpHeader: [...convertReqHeaders(reqHeaders), cookieString ? `Cookie: ${cookieString}` : undefined],
        sslVerifyHost: false,
        sslVerifyPeer: false,
        followLocation: true,
        acceptEncoding: 'br, gzip, deflate',
        maxRedirs: maxRedirects,
      });
      return {
        data,
        headers: convertResHeaders(headers?.pop() ?? {}),
        statusCode,
      };
    }
    default:
      return;
  }
};

request.get = request;

request.post = (
  url,
  data: JsonValue,
  { method = 'GET', body, query, proxy, cookies, headers = {}, maxRedirects: maxRedirect = 3, timeout, driver = 'curly' }: RequestOptionsType = {},
) => {
  body = data;
  return request(url, { method, body, query, proxy, cookies, headers, maxRedirects: maxRedirect, timeout, driver });
};
