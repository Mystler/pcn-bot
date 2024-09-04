import { SlashCommandBuilder, InteractionContextType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { addCarrier, saveCache, removeCarrier, CarrierDB } from "../carrier-db";
import { Command } from "../commands";

export const pcnCommand: Command = {
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
    .addSubcommand((subcommand) => subcommand.setName("unregister").setDescription("Remove your carrier"))
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("List all known carriers"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set-name")
        .setDescription("Update your carrier name")
        .addStringOption((option) =>
          option.setName("name").setDescription("The name of your carrier").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set-location")
        .setDescription("Update your carrier location manually")
        .addStringOption((option) =>
          option.setName("location").setDescription("The location of your carrier").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("get-user")
        .setDescription("Get the carrier information for a Discord user")
        .addUserOption((option) => option.setName("user").setDescription("Discord user").setRequired(true))
    ),
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
      removeCarrier((x) => x.DiscordID === interaction.user.id);
      saveCache();
      await interaction.reply(`Removed carrier information for ${interaction.user.displayName}.`);
    } else if (command === "list") {
      const lines = CarrierDB.map((x) => `${x.Name} ${x.Callsign} of <@${x.DiscordID}> in ${x.Location}`).sort();
      const embed = new EmbedBuilder()
        .setColor(14079702)
        .setTitle("Prismatic Carrier Network")
        .setDescription(lines.join("\n"));
      await interaction.reply({
        embeds: [embed],
      });
    } else if (command === "set-name") {
      const carrier = CarrierDB.find((x) => x.DiscordID === interaction.user.id);
      if (carrier) {
        carrier.Name = interaction.options.getString("name");
        saveCache();
        await interaction.reply(`Updated carrier name for ${carrier.Callsign} to ${carrier.Name}.`);
      } else {
        await interaction.reply(`Error: You have no carrier registered to you!`);
      }
    } else if (command === "set-location") {
      const carrier = CarrierDB.find((x) => x.DiscordID === interaction.user.id);
      if (carrier) {
        carrier.Location = interaction.options.getString("location");
        saveCache();
        await interaction.reply(`Updated location for ${carrier.Callsign} to ${carrier.Location}.`);
      } else {
        await interaction.reply(`Error: You have no carrier registered to you!`);
      }
    } else if (command === "get-user") {
      const carrier = CarrierDB.find((x) => x.DiscordID === interaction.options.getUser("user").id);
      if (carrier) {
        const embed = new EmbedBuilder()
          .setColor(14079702)
          .setTitle("Prismatic Carrier Network")
          .setDescription(
            `${carrier.Name} ${carrier.Callsign} of <@${carrier.DiscordID}> has been last seen in **${carrier.Location}**.`
          );
        await interaction.reply({
          embeds: [embed],
        });
      } else {
        await interaction.reply(`Error: No carrier information found!`);
      }
    }
  },
};
