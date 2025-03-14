import config from "../config.json" with { type: "json" };
import { loadCache } from "./carrier-db.js";
import { Client, EmbedBuilder, Events, GatewayIntentBits, TextChannel } from "discord.js";
import { Commands, setupCommands } from "./commands.js";
import { runEDDNListener } from "./eddn-listener.js";

loadCache();
setupCommands();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (readyClient) => {
  log(`Discord bot logged in as ${readyClient.user.tag}!`);
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

export async function announce(msg: string, title: string = "Prismatic Carrier Network") {
  const channel = client.channels.cache.get(config.announce_channel) as TextChannel;
  const embed = new EmbedBuilder().setColor(14079702).setTitle(title).setDescription(msg);
  await channel.send({
    embeds: [embed],
  });
}

export async function sendEmbed(embed: EmbedBuilder, message?: string) {
  const channel = client.channels.cache.get(config.announce_channel) as TextChannel;
  await channel.send({
    content: message,
    embeds: [embed],
  });
}

export function log(message: string) {
  console.log(`${new Date().toLocaleString()}: ${message}`);
}

runEDDNListener();

client.login(config.token);
