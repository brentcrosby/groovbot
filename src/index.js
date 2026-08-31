(async () => {
	const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
	require('dotenv').config();
	const loadCommands = require('./loaders/loadCommands');
	const loadEvents = require('./loaders/loadEvents');
	const { Player } = require('discord-player');
	const { YoutubeiExtractor } = require('discord-player-youtubei');

	const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
	const player = new Player(client);
	const token = process.env.TOKEN;

	client.commands = new Collection();

	// Load commands and events
	loadCommands(client);
	loadEvents(client, player);

	// Setup extractors
	await player.extractors.register(YoutubeiExtractor, {
		streamOptions: {
			useClient: "ANDROID",
		},
	});

	await player.extractors.loadDefault(
		(ext) => !["YouTubeExtractor"].includes(ext)
	);

	// Prevent crash on unhandled promise rejection
	process.on("unhandledRejection", (reason) => console.error(reason));
	process.on("uncaughtException", (error) => console.error(error));

	// **Log Warning Handler (Silencing YouTube Shorts errors)**
	process.on('warning', (warning) => {
			if (warning.message.includes('ShortsLockupView changed')) {
					console.warn('Handled YouTube Shorts Error:', warning.message);
			}
	});

	await client.login(token);

})();
