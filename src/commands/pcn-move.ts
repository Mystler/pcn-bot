import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  InteractionContextType,
  ChatInputCommandInteraction,
} from "discord.js";
import { findCarrierByCallsign, saveCache } from "../carrier-db";
import { Command } from "../commands";

export const pcnMoveCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("pcn-move")
    .setDescription("ADMIN: Change a carrier location by callsign")
    .addStringOption((option) =>
      option.setName("callsign").setDescription("Callsign of the carrier to move").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("location").setDescription("New location of the carrier").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts([InteractionContextType.Guild]),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const callsign = interaction.options.getString("callsign")!.toUpperCase();
    const location = interaction.options.getString("location")!.toUpperCase();
    const carrier = findCarrierByCallsign(callsign);
    if (carrier) {
      carrier.Location = location;
      saveCache();
      await interaction.reply(`Moved carrier ${carrier.Name} ${carrier.Callsign} to ${carrier.Location}.`);
    } else {
      await interaction.reply(`ERROR: No carrier found for callsign ${callsign}!`);
    }
  },
};
