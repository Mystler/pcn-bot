import { ChatInputCommandInteraction, Collection, SharedSlashCommand } from "discord.js";
import { pcnCommand } from "./commands/pcn.js";
import { pcnDeleteCommand } from "./commands/pcn-delete.js";
import { pcnMoveCommand } from "./commands/pcn-move.js";
import { pcnLastCommand } from "./commands/pcn-last.js";

/**
 * Structure to represent a slash command.
 * data: The SlashCommandBuilder result that describes the commands.
 * execute: The function that implements the command.
 */
export interface Command {
  data: SharedSlashCommand;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

/**
 * Collection of available slash commands
 */
export const Commands = new Collection<string, Command>();

function addCommand(cmd: Command) {
  Commands.set(cmd.data.name, cmd);
}

/**
 * Initialize the list of enabled commands. Enabled/disable commands within this function.
 */
export function setupCommands() {
  // Add commands here to enable them
  addCommand(pcnCommand);
  addCommand(pcnDeleteCommand);
  addCommand(pcnMoveCommand);
  addCommand(pcnLastCommand);
}
