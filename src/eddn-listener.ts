import { Subscriber } from "zeromq";
import { inflateSync } from "zlib";
import { announce, log, sendEmbed } from "./bot";
import { createCarrierInfoEmbed, findCarrierByCallsign, saveCache } from "./carrier-db";
import { getLastMessage, setLastMessage } from "./eddn-meta";

export async function runEDDNListener() {
  const sock = new Subscriber();
  sock.connect("tcp://eddn.edcd.io:9500");
  sock.subscribe("");
  log("Worker connected to EDDN.");

  runTimeoutCatcher();

  for await (const [msg] of sock) {
    if (!msg) continue;
    setLastMessage(new Date());
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
        let updated = false;
        if (JSON.stringify(carrier.Market) !== JSON.stringify(data.commodities)) {
          updated = true;
        }
        carrier.Market = data.commodities;
        carrier.LastMarketUpdate = data.timestamp;
        saveCache();
        if (updated) sendEmbed(createCarrierInfoEmbed(carrier), "Market Update Detected");
      }
    } else if (eddn.$schemaRef === "https://eddn.edcd.io/schemas/fcmaterials_journal/1") {
      // FCMaterials schema for bartender tracking
      const data = eddn.message as EDDNFCMaterialsMessage;
      const carrier = findCarrierByCallsign(data.CarrierID);
      if (carrier) {
        let updated = false;
        if (JSON.stringify(carrier.Bartender) !== JSON.stringify(data.Items)) {
          updated = true;
        }
        carrier.Bartender = data.Items;
        carrier.LastBartenderUpdate = data.timestamp;
        saveCache();
        if (updated) sendEmbed(createCarrierInfoEmbed(carrier), "Bartender Update Detected");
      }
    }
  }
  console.error("ZMQ runner exited! Exiting bot to schedule restart.");
  process.exit(1);
}

// Kill the process if we haven't received any data in 5 minutes. Kudos to elitebgs for this failsafe approach.
async function runTimeoutCatcher() {
  setInterval(async () => {
    const now = new Date();
    if (now.valueOf() - (getLastMessage()?.valueOf() ?? 0) > 300000) {
      log("No EDDN messages received in 5 minutes. Exiting to schedule restart!");
      process.exit(1);
    }
  }, 10000);
}
