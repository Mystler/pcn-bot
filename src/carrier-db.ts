import { EmbedBuilder, User } from "discord.js";
import fs from "node:fs";
import Templates from "./templates";
import { capitalize, stripVarName } from "./helpers";

// Hardcoded DB file
const CacheFile = "carriers.json";

/** Structure that describes our internal Carrier DB fields. */
interface Carrier {
  DiscordID: string;
  Callsign: string;
  Name: string;
  Location: string;
  CarrierID?: number;
  Services?: string[];
  Market?: EDDNCommodity[];
  Bartender?: EDDNFCMaterial[];
  LastUpdate?: string;
  LastMarketUpdate?: string;
  LastBartenderUpdate?: string;
}

let CarrierDB: Carrier[] = [];

/**
 * Load the CarrierDB from the cache file.
 */
export function loadCache(): void {
  try {
    CarrierDB = JSON.parse(fs.readFileSync(CacheFile).toString());
  } catch {
    console.log("No cache found, starting from scratch.");
  }
}

/**
 * Save the CarrierDB to the cache file.
 */
export function saveCache(): void {
  fs.writeFileSync(CacheFile, JSON.stringify(CarrierDB));
}

/**
 * Add a new carrier and remove the existing one if the discord ID already has one.
 * @param carrier - Carrier object
 */
export function addCarrier(carrier: Carrier): void {
  CarrierDB = CarrierDB.filter((element) => element.DiscordID !== carrier.DiscordID);
  CarrierDB.push(carrier);
}

/**
 * Remove carriers matching the supplied filter function.
 * @param fitlerFunc - The function that determines which carriers should be removed.
 * @returns true if anything changed.
 */
export function removeCarrier(filterFunc: (carrier: Carrier) => boolean): boolean {
  const before = CarrierDB.length;
  CarrierDB = CarrierDB.filter((carrier) => !filterFunc(carrier));
  return CarrierDB.length !== before;
}

/**
 * Find a carrier matching a callsign.
 * @param callsign - Carrier ID to look for
 * @returns Carrier object or undefined
 */
export function findCarrierByCallsign(callsign?: string): Carrier | undefined {
  return CarrierDB.find((x) => x.Callsign === callsign);
}

/**
 * Find a carrier matching an owning Discord user.
 * @param user - Discord user to check ownership for
 * @returns Carrier object or undefined
 */
export function findCarrierByUser(user: User): Carrier | undefined {
  return CarrierDB.find((x) => x.DiscordID === user.id);
}

// Translate services into proper names
const ServiceMap: Record<string, string> = {
  refuel: "Refuel",
  repair: "Repair",
  rearm: "Restock",
  shipyard: "Shipyard",
  outfitting: "Outfitting",
  exploration: "Universal Cartographics",
  voucherredemption: "Redemption Office",
  bartender: "Bartender",
  vistagenomics: "Vista Genomics",
  pioneersupplies: "Pioneer Supplies",
  blackmarket: "Secure Warehouse",
};

/**
 * Create a list of strings describing our whitelisted services
 * @param Carrier
 * @returns Array of known services
 */
function getCarrierServices(carrier: Carrier): string[] {
  if (!carrier.Services) return [];
  return carrier.Services.map((x) => ServiceMap[x])
    .filter((x) => x)
    .sort() as string[];
}

export enum MarketOperations {
  Selling,
  Buying,
  SellingMaterials,
  BuyingMaterials,
}

/**
 * Convert our known market and bartender information into a list of strings about all orders for the given type.
 * @param Carrier
 * @param type - Order type to check for (perspective of what the carrier does)
 */
function getCarrierMarketInfo(carrier: Carrier, type: MarketOperations): string[] {
  // demand should come with sellPrice and stock should come with buyPrice
  switch (type) {
    case MarketOperations.Selling:
      if (!carrier.Market) return [];
      return carrier.Market.filter((x) => x.stock > 0 && x.buyPrice > 0)
        .sort((a, b) => (a > b ? 1 : b > a ? -1 : 0))
        .map((x) => `${x.stock} ${capitalize(x.name)} for ${x.buyPrice.toLocaleString("en-US")} cr/t`);
    case MarketOperations.Buying:
      if (!carrier.Market) return [];
      return carrier.Market.filter((x) => x.demand > 0 && x.sellPrice > 0)
        .sort((a, b) => (a > b ? 1 : b > a ? -1 : 0))
        .map((x) => `${x.demand} ${capitalize(x.name)} for ${x.sellPrice.toLocaleString("en-US")} cr/t`);
    case MarketOperations.SellingMaterials:
      if (!carrier.Bartender) return [];
      return carrier.Bartender.filter((x) => x.Stock > 0 && x.Price > 0)
        .sort((a, b) => (a > b ? 1 : b > a ? -1 : 0))
        .map((x) => `${x.Stock} ${capitalize(stripVarName(x.Name))}`);
    case MarketOperations.BuyingMaterials:
      if (!carrier.Bartender) return [];
      return carrier.Bartender.filter((x) => x.Demand > 0 && x.Price > 0)
        .sort((a, b) => (a > b ? 1 : b > a ? -1 : 0))
        .map((x) => `${x.Demand} ${capitalize(stripVarName(x.Name))}`);
  }
}

/**
 * Create an embed that displays the information for a specific carrier.
 * @param carrier - DB object
 * @returns Embed
 */
export function createCarrierInfoEmbed(carrier: Carrier): EmbedBuilder {
  const services = getCarrierServices(carrier);
  return new EmbedBuilder()
    .setColor(14079702)
    .setTitle(`${carrier.Name} ${carrier.Callsign}`)
    .setDescription(
      Templates.CarrierInfo({
        carrier,
        services,
        selling: getCarrierMarketInfo(carrier, MarketOperations.Selling),
        buying: getCarrierMarketInfo(carrier, MarketOperations.Buying),
        sellingMats: getCarrierMarketInfo(carrier, MarketOperations.SellingMaterials),
        buyingMats: getCarrierMarketInfo(carrier, MarketOperations.BuyingMaterials),
      })
    );
}

/**
 * Create an embed that lists all known Carriers.
 * @param carrier - DB object
 * @returns Embed
 */
export function createCarrierListEmbed(): EmbedBuilder {
  const lines = CarrierDB.map((x) => `- ${x.Name} ${x.Callsign} of <@${x.DiscordID}> in ${x.Location}`).sort();
  return new EmbedBuilder().setColor(14079702).setTitle("Prismatic Carrier Network").setDescription(lines.join("\n"));
}

function getAllMarketInfo(type: MarketOperations): Record<string, string[]> {
  const results: Record<string, string[]> = {};
  for (const carrier of CarrierDB) {
    const carrierStr = `${carrier.Name} ${carrier.Callsign}`;
    if (type === MarketOperations.Selling || type === MarketOperations.Buying) {
      if (!carrier.Market) continue;

      for (const item of carrier.Market) {
        // Filter wrong type of order
        if (type === MarketOperations.Selling && (!item.stock || !item.buyPrice)) continue;
        if (type === MarketOperations.Buying && (!item.demand || !item.sellPrice)) continue;
        // Add item and carrier to list
        const name = capitalize(item.name);
        if (results[name]) results[name]?.push(carrierStr);
        else results[name] = [carrierStr];
      }
    } else if (type === MarketOperations.SellingMaterials || type === MarketOperations.BuyingMaterials) {
      if (!carrier.Bartender) continue;
      for (const item of carrier.Bartender) {
        // Filter wrong type of order
        if (type === MarketOperations.SellingMaterials && (!item.Stock || !item.Price)) continue;
        if (type === MarketOperations.BuyingMaterials && (!item.Demand || !item.Price)) continue;
        // Add item and carrier to list
        const name = capitalize(stripVarName(item.Name));
        if (results[name]) results[name]?.push(carrierStr);
        else results[name] = [carrierStr];
      }
    }
  }
  return results;
}

/**
 * Create an embed that displays the market info for all carriers.
 * @param type - What is the carrier doing
 * @returns Embed
 */
export function createAllMarketsEmbed(type: MarketOperations): EmbedBuilder {
  const services = getAllMarketInfo(type);
  const title =
    "Carriers are " +
    (type === MarketOperations.Buying || type === MarketOperations.BuyingMaterials ? "Buying" : "Selling") +
    (type === MarketOperations.SellingMaterials || type === MarketOperations.BuyingMaterials
      ? " (Odyssey Materials)"
      : "");
  return new EmbedBuilder()
    .setColor(14079702)
    .setTitle(title)
    .setDescription(
      Templates.MarketInfo({
        services: Object.entries(services).sort((a, b) => (a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0)),
      })
    );
}
