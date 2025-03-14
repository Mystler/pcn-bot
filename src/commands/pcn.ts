import { SlashCommandBuilder, InteractionContextType, ChatInputCommandInteraction } from "discord.js";
import {
  addCarrier,
  saveCache,
  removeCarrier,
  createCarrierInfoEmbed,
  findCarrierByUser,
  findCarrierByCallsign,
  createCarrierListEmbed,
  createAllMarketsEmbed,
  MarketOperations,
  type MarketOperationsType,
} from "../carrier-db.js";
import { type Command } from "../commands.js";

async function register(interaction: ChatInputCommandInteraction) {
  const callsign = interaction.options.getString("callsign")!.toUpperCase();
  const name = interaction.options.getString("name")!;
  addCarrier({
    DiscordID: interaction.user.id,
    Callsign: callsign,
    Name: name,
    Location: "N/A",
  });
  saveCache();
  await interaction.reply(
    `Registered carrier ${name} for ${interaction.user.displayName}.\nPlease note that updates are only detected from people that visit the carrier and run EDMC, EDDiscovery, or similar software. You should run it yourself if you want to send your own location updates.`,
  );
}

async function unregister(interaction: ChatInputCommandInteraction) {
  removeCarrier((x) => x.DiscordID === interaction.user.id);
  saveCache();
  await interaction.reply(`Removed carrier information for ${interaction.user.displayName}.`);
}

async function list(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    embeds: [createCarrierListEmbed()],
  });
}

async function setName(interaction: ChatInputCommandInteraction) {
  const carrier = findCarrierByUser(interaction.user);
  if (carrier) {
    carrier.Name = interaction.options.getString("name")!;
    saveCache();
    await interaction.reply(`Updated carrier name for ${carrier.Callsign} to ${carrier.Name}.`);
  } else {
    await interaction.reply(`Error: You have no carrier registered to you!`);
  }
}

async function setLocation(interaction: ChatInputCommandInteraction) {
  const carrier = findCarrierByUser(interaction.user);
  if (carrier) {
    carrier.Location = interaction.options.getString("location")!;
    carrier.LastUpdate = new Date().toISOString();
    saveCache();
    await interaction.reply(`Updated location for ${carrier.Callsign} to ${carrier.Location}.`);
  } else {
    await interaction.reply(`Error: You have no carrier registered to you!`);
  }
}

async function getUser(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user")!;
  const carrier = findCarrierByUser(user);
  if (carrier) {
    await interaction.reply({
      embeds: [createCarrierInfoEmbed(carrier)],
    });
  } else {
    await interaction.reply(`Error: No carrier information found!`);
  }
}

async function getCallsign(interaction: ChatInputCommandInteraction) {
  const callsign = interaction.options.getString("callsign")!.toUpperCase();
  const carrier = findCarrierByCallsign(callsign);
  if (carrier) {
    await interaction.reply({
      embeds: [createCarrierInfoEmbed(carrier)],
    });
  } else {
    await interaction.reply(`Error: No carrier information found!`);
  }
}

async function market(interaction: ChatInputCommandInteraction) {
  const type = interaction.options.getInteger("type") as MarketOperationsType;
  await interaction.reply({
    embeds: [createAllMarketsEmbed(type)],
  });
}

// Map subcommand names to our function implementations
const FuncMap: Record<string, (interaction: ChatInputCommandInteraction) => Promise<void>> = {
  register,
  unregister,
  list,
  "set-name": setName,
  "set-location": setLocation,
  "get-user": getUser,
  "get-callsign": getCallsign,
  market,
};

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
          option.setName("callsign").setDescription("The call sign of your carrier").setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("name").setDescription("The name of your carrier").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName("unregister").setDescription("Remove your carrier"))
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("List all known carriers"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set-name")
        .setDescription("Update your carrier name")
        .addStringOption((option) =>
          option.setName("name").setDescription("The name of your carrier").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set-location")
        .setDescription("Update your carrier location manually")
        .addStringOption((option) =>
          option.setName("location").setDescription("The location of your carrier").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("get-user")
        .setDescription("Get the carrier information for a Discord user")
        .addUserOption((option) => option.setName("user").setDescription("Discord user").setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("get-callsign")
        .setDescription("Get the carrier information for a Carrier ID")
        .addStringOption((option) => option.setName("callsign").setDescription("Carrier ID").setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("market")
        .setDescription("Get an overview of known buy/sell orders in our carrier network")
        .addIntegerOption((option) =>
          option
            .setName("type")
            .setDescription("What type of orders are you looking for?")
            .setRequired(true)
            .addChoices(
              { name: "Buying", value: MarketOperations.Buying },
              { name: "Bartender Buying", value: MarketOperations.BuyingMaterials },
              { name: "Selling", value: MarketOperations.Selling },
              { name: "Bartender Selling", value: MarketOperations.SellingMaterials },
            ),
        ),
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    // Look up our matching subcommand implementation using FuncMap.
    const command = interaction.options.getSubcommand();
    if (FuncMap[command]) {
      await FuncMap[command](interaction);
    } else {
      await interaction.reply(`Error: Function not implemented! Blame Mystler!`);
    }
  },
};
