const { SlashCommandBuilder } = require('discord.js');
const { useQueue, useMainPlayer } = require('discord-player');
const { ensureActiveQueueAndChannel } = require('../../utils/musicUtils')

module.exports = {
  category: 'music',
  data: new SlashCommandBuilder()
    .setName('tomfoolery')
    .setDescription('Ooh secret command'),
  async execute(interaction) {

    const check = await ensureActiveQueueAndChannel(interaction);
    if (!check) return;

    const queue = useQueue(interaction.guild.id);
    const player = useMainPlayer();
    const query = 'summer of tomfoolery';


    // Defer interaction so the request has time to process
    await interaction.deferReply();

    // Search for song
    const result = await player.search(query, {
      requestedBy: interaction.user,
    });

    try {
      queue.insertTrack(result.tracks[0], 0);
      queue.node.skip();
      if (!queue.isPlaying()) {
        await queue.node.play();
      }

      await interaction.editReply(`It appears there's a bit of tomfoolery afoot!`)
    } catch (e) {
      // Return error if something failed
      return interaction.followUp(`Something went wrong: ${e}`);
    }

  }
};
