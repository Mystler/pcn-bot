# Prismatic Carrier Network

A simple Typescript Discord bot for tracking the Prismatic Imperium's carriers.

- Allows registering one carrier by user through slash commands.
- Carriers get tracked by listening to EDDN.
- Updates get posted to an announcement channel on Discord.

_Developed for Node version 20 or higher._

## Installation

Make sure to copy the `config.sample.json` file to `config.json` and enter the proper information:

- token: Secret token from the "Bot" menu
- client_id: Application ID from "General Information"
- announce_channel: The ID of the channel to post carrier updates to

Then, just run:

```sh
npm ci # To get the dependencies
npm run build # To build the Typescript sources into JS files in dist/
npm run register # To register the latest set of slash commands if they changed
npm run start # To run the bot
```

The DB is a simple JSON file in `carriers.json`.
