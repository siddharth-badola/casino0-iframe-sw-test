import { APP_ENV } from "./constant";

const appEnv = process.env.APP_ENV;
const apiUrl = APP_ENV.LOCAL === appEnv ? "" : process.env.API_URL;

export const APP_CONFIG = {
  API_URL: apiUrl,
  APP_TARGET: process.env.APP_TARGET,
  APP_BUNDLE_ID: process.env.APP_BUNDLE_ID,
  APP_ENV: appEnv,
};
