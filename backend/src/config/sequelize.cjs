"use strict";

const path = require("path");
const dotenv = require("dotenv");

const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const baseConfig = {
  dialect: "postgres",
};

const shouldUseSsl = String(process.env.DB_SSL || "").toLowerCase() === "true";

if (shouldUseSsl) {
  baseConfig.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

const config = process.env.DATABASE_URL
  ? {
      ...baseConfig,
      use_env_variable: "DATABASE_URL",
    }
  : {
      ...baseConfig,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
    };

module.exports = {
  development: config,
  test: config,
  production: config,
};
