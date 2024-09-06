import { EmbedBuilder, User } from "discord.js";
import fs from "node:fs";
import { timestampToDiscordTimestamp } from "./helpers";

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

function getCarrierServicesText(carrier: Carrier): string {
  if (!carrier.Services) return "**Available Services**\nUnknown";
  const services = carrier.Services.map((x) => ServiceMap[x])
    .filter((x) => x)
    .sort();
  return "**Available Services**\n" + services.join(", ");
}

/**
 * Create an embed that displays the information for a specific carrier.
 * @param carrier - DB object
 * @returns Embed
 */
export function createCarrierInfoEmbed(carrier: Carrier): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(14079702)
    .setTitle(`${carrier.Name} ${carrier.Callsign}`)
    .setDescription(
      `**Owner:** <@${carrier.DiscordID}>\n**Location:** [${
        carrier.Location
      }](https://inara.cz/elite/starsystem/?search=${encodeURIComponent(
        carrier.Location
      )})\n**Last Update:** ${timestampToDiscordTimestamp(carrier.LastUpdate)}\n\n${getCarrierServicesText(carrier)}`
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
