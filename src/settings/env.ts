import { config } from 'dotenv';
import { cleanEnv, str, host, port, bool, url } from 'envalid';

export const EnvSettings =
  config({ path: process.env.MIKRO_ORM_ENV || '.env' }) &&
  cleanEnv(process.env, {
    SECRET: str({ desc: '生成密钥用的机密字符串' }),
    SERVER_PORT: port({ desc: '服务器端口' }),
    MIKRO_ORM_TYPE: str({ desc: '数据库类型', choices: ['postgresql'] }),
    MIKRO_ORM_HOST: host({ desc: '数据库主机 IP 或域名' }),
    MIKRO_ORM_PORT: port({ desc: '数据库端口' }),
    MIKRO_ORM_USER: str({ desc: '数据库用户名' }),
    MIKRO_ORM_PASSWORD: str({ desc: '数据库密码' }),
    MIKRO_ORM_DB_NAME: str({ desc: '数据库名' }),
    MIKRO_ORM_TIMEZONE: str({ desc: '数据库时区', default: '+08:00' }),
    REDIS_HOST: host({ desc: 'Redis 主机 IP 或域名' }),
    REDIS_PORT: port({ desc: 'Redis 端口号' }),
    PROXY_ENABLED: bool({ desc: '是否启用代理', default: false }),
    PROXY_HOST: host({ desc: '代理服务器主机', default: '127.0.0.1' }),
    PROXY_PORT: port({ desc: '代理服务器端口', default: 8888 }),
    PROXY_USERNAME: str({ desc: '代理服务器用户名', default: undefined }),
    PROXY_PASSWORD: str({ desc: '代理服务器密码', default: undefined }),
    TI_ANTI_AKAMAI_URL: url({ desc: '反 Akamai 服务器地址', default: 'http://82.157.56.17:6688/akamai' }),
    TI_HOMEPAGE_URL: url({ desc: '德州仪器首页地址', default: 'https://www.ti.com.cn' }),
  });
