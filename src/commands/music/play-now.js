const { SlashCommandBuilder } = require('discord.js');
const { useQueue, useMainPlayer } = require('discord-player');
const { ensureActiveQueueAndChannel } = require('../../utils/musicUtils')

module.exports = {
  category: 'music',
  data: new SlashCommandBuilder()
    .setName('play-now')
    .setDescription('Skips queue to play song')
    .addStringOption(option =>
			option.setName('query')
				.setDescription('The name of the song, you want to play.')
				.setRequired(true)),
  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);
    const player = useMainPlayer();
    const query = interaction.options.getString('query');

    const check = await ensureActiveQueueAndChannel(interaction);
    if (!check) return;


    // Defer interaction so the request has time to process
    await interaction.deferReply();

    // Search for song
    const result = await player.search(query, {
      requestedBy: interaction.user,
    });
  
    if (!result.hasTracks()) {
      return interaction.editReply(`No results found for \`${query}\`.`);
    }


    try {
      queue.insertTrack(result.tracks[0], 0);
      queue.node.skip();
      if (!queue.isPlaying()) {
        await queue.node.play();
      }

      await interaction.editReply(`You got it on the double ya dapper dog!`)
    } catch (e) {
      // Return error if something failed
      return interaction.followUp(`Something went wrong: ${e}`);
    }

  }
};
