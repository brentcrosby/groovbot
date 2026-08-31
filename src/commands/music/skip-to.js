const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');
const { ensureActiveQueueAndChannel } = require('../../utils/musicUtils');

module.exports = {
  category: 'music',
  data: new SlashCommandBuilder()
    .setName('skip-to')
    .setDescription('Skips current song')
    .addIntegerOption((option) => 
      option.setName('track-number')
        .setDescription('The track position in the queue to skip to')
        .setRequired(true)
    )
    .addBooleanOption((option) =>
			option.setName('save-queue')
				.setDescription('Keep skipped songs')
				.setRequired(false)
		),
  async execute(interaction) {

    // Ensure the user is in a voice channel and there is an active queue
    const check = await ensureActiveQueueAndChannel(interaction);
    if (!check) return;

    const queue = useQueue (interaction.guild.id);
    const position = interaction.options.getInteger('track-number');

    if (queue.size < 1) {
      return interaction.reply('There are no queued tracks to skip to.');
    }

    if (!Number.isInteger(position) || position < 1 || position > queue.size) {
      return interaction.reply(`Please provide a track number between 1 and ${queue.size}. Use the queue command to see what I've got coming up!`);
    }

    const saveQueue = interaction.options.getBoolean('save-queue');
    if (saveQueue) {
      queue.node.jump(position - 1);
    } else {
      queue.node.skipTo(position - 1);
    }
    return interaction.reply('Skipping to the song now big man!');
  }
};
