import fs from "node:fs";
const CacheFile = "carriers.json";

interface Carrier {
  DiscordID: string;
  Callsign: string;
  Name: string;
  Location: string;
  CarrierID?: number;
}

export let CarrierDB: Carrier[] = [];

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
 */
export function addCarrier(carrier: Carrier): void {
  CarrierDB = CarrierDB.filter((element) => element.DiscordID !== carrier.DiscordID);
  CarrierDB.push(carrier);
}

/**
 * Remove carriers matching the supplied filter function
 */
export function removeCarrier(filterFunc: (carrier: Carrier) => boolean): void {
  CarrierDB = CarrierDB.filter((carrier) => !filterFunc(carrier));
}

export default { loadCache, saveCache, addCarrier, removeCarrier, CarrierDB };
