import config from "../config.json";
import { loadCache } from "./carrier-db";
import { Client, EmbedBuilder, Events, GatewayIntentBits, TextChannel } from "discord.js";
import { Commands, setupCommands } from "./commands";
import { runEDDNListener } from "./eddn-listener";

loadCache();
setupCommands();

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

export function announce(msg: string) {
  const channel = client.channels.cache.get(config.announce_channel) as TextChannel;
  const embed = new EmbedBuilder().setColor(14079702).setTitle("Prismatic Carrier Network").setDescription(msg);
  channel.send({
    embeds: [embed],
  });
}

runEDDNListener();

client.login(config.token);
