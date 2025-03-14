import Handlebars from "handlebars";
import fs from "node:fs";
import { timestampToDiscordTimestamp } from "./helpers.js";

Handlebars.registerHelper("urlencode", encodeURIComponent);
Handlebars.registerHelper("lastUpdate", timestampToDiscordTimestamp);
Handlebars.registerHelper("join", <T>(array: T[], separator: string): string => {
  return array.join(separator);
});

export default {
  CarrierInfo: Handlebars.compile(fs.readFileSync("templates/carrier-info.hbs").toString(), { noEscape: true }),
  MarketInfo: Handlebars.compile(fs.readFileSync("templates/market-info.hbs").toString(), { noEscape: true }),
};
