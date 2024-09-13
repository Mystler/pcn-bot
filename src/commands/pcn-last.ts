import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  InteractionContextType,
  ChatInputCommandInteraction,
} from "discord.js";
import { Command } from "../commands";
import { dateToDiscordTimestamp } from "../helpers";
import { getLastMessage } from "../eddn-meta";

export const pcnLastCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("pcn-last")
    .setDescription("ADMIN: When was the last EDDN message received?")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts([InteractionContextType.Guild]),
  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.reply(`Last EDDN message was processed at ${dateToDiscordTimestamp(getLastMessage())}`);
  },
};
