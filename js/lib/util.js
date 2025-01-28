import { AGGREGATOR, CHINESE_LOCALES } from "./constant";

export const isValidJsonString = (value) => {
  try {
    const v = JSON.parse(value);
    return !!v || v === 0 || v === false || value === "" || value === null;
  } catch (e) {
    return false;
  }
};

/**
 * @see https://services-cloud.atlassian.net/browse/FK-1144
 * @param {string} [url]
 * @param {{aggregator?:string,isIos?:boolean,locale?:string}} [options]
 * @returns {string}
 */
export const modifyGameUrl = (url = "", options = {}) => {
  if (typeof url !== "string") return url;

  const queryString = url.split("?")[1] ?? "";
  const params = queryString.split("&").filter(Boolean);
  const { aggregator, isIos, locale } = options;

  if (!params.length) return url;

  for (let i = 0; i < params.length; i++) {
    const [paramName, paramValue] = params[i].split("=");
    // If the parameter is "languageCode" and its value is "yn" or "vn", change it to "en"
    if (
      paramName === "languageCode" &&
      (paramValue === "yn" || paramValue === "vn")
    ) {
      params[i] = `${paramName}=vi`;
    }
  }

  switch (true) {
    case isIos && aggregator === AGGREGATOR.ASIAGAMING:
      params.push("type=h5");
      break;
    case aggregator === AGGREGATOR.HABA:
      params.push("isHide=1");
      if (!CHINESE_LOCALES.includes(locale)) params.push("lang=en");
      break;
  }

  const updatedQueryString = params.join("&");
  return url.split("?")[0] + "?" + updatedQueryString;
};
