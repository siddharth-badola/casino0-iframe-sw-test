const dotenv = require("dotenv");

module.exports = {
  getConfig: (envPath) => {
    dotenv.config({ path: envPath });

    return JSON.stringify({
      API_URL: process.env.API_URL,
      APP_BUNDLE_ID: process.env.API_URL,
      APP_ENV: process.env.APP_ENV,
      APP_TARGET: process.env.APP_TARGET,
    });
  },
};
