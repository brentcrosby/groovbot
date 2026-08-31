const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');
const { ensureActiveQueueAndChannel } = require('../../utils/musicUtils');

module.exports = {
  category: 'music',
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a song from queue')
    .addIntegerOption((option) => 
      option.setName('track-number')
        .setDescription('The track position of the track to remove')
        .setRequired(true)
    ),
  async execute(interaction) {

    // Ensure the user is in a voice channel and there is an active queue
    const check = await ensureActiveQueueAndChannel(interaction);
    if (!check) return;

    const queue = useQueue (interaction.guild.id);
    const position = interaction.options.getInteger('track-number');

    if (queue.size < 1) {
      return interaction.reply('There are no queued tracks to remove.');
    }

    if (!Number.isInteger(position) || position < 1 || position > queue.size) {
      return interaction.reply(`Please provide a track number between 1 and ${queue.size}. Use the queue command to see what's in there.`);
    }

    queue.node.remove(position - 1);

    return interaction.reply(`Removed track at position **[${position}]**`);
  }
};
