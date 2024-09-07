import { Subscriber } from "zeromq";
import { inflateSync } from "zlib";
import { announce } from "./bot";
import { findCarrierByCallsign, saveCache } from "./carrier-db";

export async function runEDDNListener() {
  const sock = new Subscriber();
  sock.connect("tcp://eddn.edcd.io:9500");
  sock.subscribe("");
  console.log("Worker connected to EDDN.");

  for await (const [msg] of sock) {
    if (!msg) continue;
    const eddn: EDDNMessage = JSON.parse(inflateSync(msg).toString());
    if (!eddn.header.gameversion?.startsWith("4")) continue;
    if (eddn.$schemaRef === "https://eddn.edcd.io/schemas/journal/1") {
      // Regular journal event for carrier location tracking
      const data = eddn.message as EDDNJournalMessage;
      const carrier = findCarrierByCallsign(data.StationName);
      if (carrier) {
        if (carrier.Location !== data.StarSystem) {
          // System changed, announce jump asynchronously.
          announce(
            `${carrier.Name} ${carrier.Callsign} of <@${carrier.DiscordID}> has been detected at a new location in **${data.StarSystem}** (was ${carrier.Location}).`,
            "Jump Detected"
          );
        }
        carrier.Location = data.StarSystem;
        carrier.CarrierID = data.MarketID ?? carrier.CarrierID;
        carrier.Services = data.StationServices ?? carrier.Services;
        carrier.LastUpdate = data.timestamp;
        saveCache();
      }
    } else if (eddn.$schemaRef === "https://eddn.edcd.io/schemas/commodity/3") {
      // Commodity schema for market tracking
      const data = eddn.message as EDDNCommodityMessage;
      const carrier = findCarrierByCallsign(data.stationName);
      if (carrier) {
        carrier.Market = data.commodities;
        carrier.LastMarketUpdate = data.timestamp;
        saveCache();
      }
    } else if (eddn.$schemaRef === "https://eddn.edcd.io/schemas/fcmaterials_journal/1") {
      // FCMaterials schema for bartender tracking
      const data = eddn.message as EDDNFCMaterialsMessage;
      const carrier = findCarrierByCallsign(data.CarrierID);
      if (carrier) {
        carrier.Bartender = data.Items;
        carrier.LastBartenderUpdate = data.timestamp;
        saveCache();
      }
    }
  }
  console.error("ZMQ runner exited! Exiting bot to schedule restart.");
  process.exit(1);
}
