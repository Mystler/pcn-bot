import {
  ChatInputCommandInteraction,
  Collection,
  EmbedBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { addCarrier, CarrierDB, removeCarrier, saveCache } from "./carrier-db";

interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute: (args: ChatInputCommandInteraction) => void;
}

const pcnCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("pcn")
    .setDescription("Interact with the Prismatic Carrier Network")
    .setContexts([InteractionContextType.Guild])
    .addSubcommand((subcommand) =>
      subcommand
        .setName("register")
        .setDescription("Register your carrier")
        .addStringOption((option) =>
          option.setName("callsign").setDescription("The call sign of your carrier").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("name").setDescription("The name of your carrier").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set-name")
        .setDescription("Update your carrier name")
        .addStringOption((option) =>
          option.setName("name").setDescription("The name of your carrier").setRequired(true)
        )
    )
    .addSubcommand((subcommand) => subcommand.setName("unregister").setDescription("Remove your carrier"))
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("List all known carriers")),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const options = interaction.options;
    const command = options.getSubcommand();
    if (command === "register") {
      const callsign = options.getString("callsign").toUpperCase();
      const name = options.getString("name");
      addCarrier({
        DiscordID: interaction.user.id,
        Callsign: callsign,
        Name: name,
        Location: "N/A",
      });
      saveCache();
      await interaction.reply(
        `Registered carrier ${name} for ${interaction.user.displayName}.\nPlease note that updates are only detected from people that visit the carrier and run EDMC, EDDiscovery, or similar software. You should run it yourself if you want to send your own location updates.`
      );
    } else if (command === "unregister") {
      removeCarrier((element) => element.DiscordID === interaction.user.id);
      saveCache();
      await interaction.reply(`Removed carrier information for ${interaction.user.displayName}.`);
    } else if (command === "list") {
      const lines = CarrierDB.map((x) => `${x.Name} ${x.Callsign} of <@${x.DiscordID}> in ${x.Location}`);
      const embed = new EmbedBuilder()
        .setColor(14079702)
        .setTitle("Prismatic Carrier Network")
        .setDescription(lines.join("\n"));
      await interaction.reply({
        embeds: [embed],
      });
    } else if (command === "set-name") {
      const carrier = CarrierDB.find((element) => element.DiscordID === interaction.user.id);
      if (carrier) {
        carrier.Name = interaction.options.getString("name");
        saveCache();
        await interaction.reply(`Updated carrier name for ${carrier.Callsign} to ${carrier.Name}.`);
      } else {
        await interaction.reply(`Error: You have no carrier registered to you!`);
      }
    }
  },
};

const pcnDeleteCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("pcn-delete")
    .setDescription("ADMIN: Delete a cerrier entry by callsign")
    .addStringOption((option) =>
      option.setName("callsign").setDescription("Callsign of the carrier to remove").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts([InteractionContextType.Guild]),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const callsign = interaction.options.getString("callsign").toUpperCase();
    removeCarrier((element) => element.Callsign === callsign);
    saveCache();
    await interaction.reply(`Removed carrier information for ${callsign}.`);
  },
};

function addCommand(cmd: Command) {
  Commands.set(cmd.data.name, cmd);
}

export const Commands = new Collection<string, Command>();
addCommand(pcnCommand);
addCommand(pcnDeleteCommand);
