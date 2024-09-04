import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  InteractionContextType,
  ChatInputCommandInteraction,
} from "discord.js";
import { removeCarrier, saveCache } from "../carrier-db";
import { Command } from "../commands";

export const pcnDeleteCommand: Command = {
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
