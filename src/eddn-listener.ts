import { Subscriber } from "zeromq";
import { inflateSync } from "zlib";
import { announce } from "./bot";
import { CarrierDB, saveCache } from "./carrier-db";

export async function runEDDNListener() {
  const sock = new Subscriber();
  sock.connect("tcp://eddn.edcd.io:9500");
  sock.subscribe("");
  console.log("Worker connected to EDDN.");

  for await (const [msg] of sock) {
    const eddn: EDDNMessage = JSON.parse(inflateSync(msg).toString());
    if (!eddn.$schemaRef.endsWith("journal/1")) continue;
    if (!eddn.header.gameversion?.startsWith("4")) continue;
    const data = eddn.message as EDDNJournalMessage;
    const carrier = CarrierDB.find((element) => element.Callsign === data.StationName);
    if (carrier && data.MarketID !== undefined) {
      carrier.CarrierID = data.MarketID;
      if (data.StarSystem !== undefined) {
        if (carrier.Location !== data.StarSystem) {
          announce(
            `${carrier.Name} ${carrier.Callsign} of <@${carrier.DiscordID}> has been detected at a new location in **${data.StarSystem}** (was ${carrier.Location}).`
          );
        }
        carrier.Location = data.StarSystem;
      }
      saveCache();
    }
  }
  console.error("ZMQ runner exited! Exiting bot to schedule restat.");
  process.exit();
}
