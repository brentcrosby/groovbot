# Groovbot

Groovbot is a Node.js Discord music bot built around slash commands, voice-channel playback, and queue management. It demonstrates Discord interactions, command loading, event-driven architecture, external API integration, and playback management with `discord-player`.

## Implemented Features

- Discord slash command handling with `discord.js` v14 and `SlashCommandBuilder`
- Command auto-loading from `src/commands/<category>/*.js`
- Discord client event loading for `ready` and `interactionCreate`
- Player event loading for playback lifecycle messages
- Voice-channel music playback through `discord-player`
- YouTube playback/search support through `discord-player-youtubei` plus default extractors, with the default YouTube extractor excluded
- Queue controls for play, play next, play now, skip, skip to, back, stop, pause/resume, shuffle, remove, clear queue, current track, history, volume, and loop mode
- Spotify playlist and album URL handling through Spotify's client credentials flow, converting Spotify track metadata into playable search queries
- Basic utility commands for ping and command reloading
- Playback defaults in a shared player configuration module

## Architecture

```text
.
|-- package.json
|-- package-lock.json
|-- scripts/
|   `-- deploy-commands.js
`-- src/
    |-- index.js
    |-- commands/
    |   |-- music/
    |   `-- utility/
    |-- commands_disabled/
    |-- config/
    |-- events/
    |   `-- player/
    |-- loaders/
    |-- modules/
    `-- utils/
```

- `src/index.js` creates the Discord client, creates the `discord-player` instance, loads commands/events, registers extractors, and logs in the bot.
- `src/loaders/loadCommands.js` discovers command files and stores valid commands in `client.commands`.
- `src/loaders/loadEvents.js` registers Discord client events from `src/events` and player events from `src/events/player`.
- `src/commands/music` contains the active music slash commands.
- `src/commands/utility` contains non-music utility slash commands.
- `src/commands_disabled` contains disabled command work, currently `seek.js`.
- `src/config/playerOptions.js` contains the queue and playback defaults used when `/play` creates a player queue.
- `src/utils/spotifyClient.js` wraps Spotify client-credentials token retrieval and caching.
- `src/utils/musicUtils.js` contains voice-channel and active-queue guard helpers.
- `src/modules/embeds.js` defines reusable Discord embed helpers, although the current command responses mostly use plain text.
- `scripts/deploy-commands.js` registers the slash commands with the Discord REST API.

## Technologies And APIs

- Node.js with CommonJS modules
- `discord.js` for the Discord Gateway client, slash command builders, interactions, and REST command registration
- `discord-player` for queue and playback management
- `discord-player-youtubei` for YouTubei extraction
- `spotify-web-api-node` for Spotify playlist and album metadata
- `dotenv` for local environment variable loading

The dependency list also includes `redis`, `ioredis`, and `mediaplex`, but there is no direct Redis or Mediaplex integration in the current source files.

## Prerequisites

- Node.js 18 or newer
- npm
- A Discord application with a bot token
- The bot invited to a Discord server with permission to use slash commands and join/speak in voice channels
- Spotify application credentials for `/play`, including non-Spotify search playback, because the current `/play` implementation requests a Spotify access token before checking the query type

## Installation

```bash
npm install
```

Create a local `.env` file in the project root:

```env
TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_client_id
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
GUILD_ID=your_discord_guild_id_optional_currently_unused
```

Environment variable notes:

- `TOKEN` is required for the bot login and command registration script.
- `CLIENT_ID` is required by `scripts/deploy-commands.js`.
- `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are required by the active `/play` command.
- `GUILD_ID` is read by `scripts/deploy-commands.js`, but the current script registers global application commands with `Routes.applicationCommands(clientId)` and does not use the guild ID.

Do not commit `.env`; it is already ignored by `.gitignore`.

## Register Slash Commands

After dependencies and environment variables are in place, register the slash commands:

```bash
node scripts/deploy-commands.js
```

The current script registers global application commands. Global command updates can take time to appear in Discord.

## Start The Bot

```bash
node src/index.js
```

There is no `npm start` script in the current `package.json`.

## Example Commands

Music:

- `/play query:never gonna give you up`
- `/play query:https://open.spotify.com/playlist/exampleplaylistid track-limit:25 queue-start:0`
- `/play query:https://open.spotify.com/album/examplealbumid track-limit:12`
- `/play-next query:daft punk one more time`
- `/play-now query:justice dance`
- `/queue`
- `/np`
- `/history`
- `/back`
- `/skip`
- `/skip-to track-number:3 save-queue:true`
- `/pause`
- `/resume`
- `/shuffle`
- `/remove track-number:2`
- `/clear-queue`
- `/volume value:50`
- `/set-loop loop-mode:3`
- `/stop`
- `/party-time`
- `/tomfoolery`

Utility:

- `/ping`
- `/reload command:play`

## Testing

```bash
npm test
```

The test suite uses Node's built-in test runner for focused command validation checks.

## Known Limitations

- The bot has no `npm start` script, so it is started directly with `node src/index.js`.
- `src/commands_disabled/seek.js` is not loaded, and its file comment says it crashes the player.
- `scripts/deploy-commands.js` reads `GUILD_ID` but does not use it because it registers global commands.
- `/play` requires Spotify credentials even for plain text search queries because it retrieves a Spotify token before checking whether the query is a Spotify URL.
