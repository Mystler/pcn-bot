import config from "../config.json";
import { REST, Routes } from "discord.js";
import { Commands, setupCommands } from "./commands";

setupCommands();
const commands = Commands.map((x) => x.data.toJSON());

const rest = new REST().setToken(config.token);
async function registerCommands() {
  try {
    console.log(`Refreshing ${commands.length} application (/) commands.`);
    await rest.put(Routes.applicationCommands(config.client_id), { body: commands });
    console.log(`Successfully reloaded commands.`);
  } catch (error) {
    console.error(error);
  }
}

registerCommands();
