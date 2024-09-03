import config from "../config.json";
import { CarrierDB, loadCache, saveCache } from "./carrier-db";
import { Client, EmbedBuilder, Events, GatewayIntentBits, TextChannel } from "discord.js";
import { inflateSync } from "node:zlib";
import { Subscriber } from "zeromq";
import { Commands } from "./commands";

loadCache();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Discord bot logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = Commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "There was an error while executing this command!", ephemeral: true });
    } else {
      await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
    }
  }
});

function announce(msg: string) {
  const channel = client.channels.cache.get(config.announce_channel) as TextChannel;
  const embed = new EmbedBuilder().setColor(14079702).setTitle("Prismatic Carrier Network").setDescription(msg);
  channel.send({
    embeds: [embed],
  });
}

async function runZMQ() {
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
  console.error("ZMQ function exited!");
}

runZMQ();

client.login(config.token);
