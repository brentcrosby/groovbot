const { SlashCommandBuilder } = require('discord.js');
const { useHistory } = require('discord-player');
const { ensureActiveQueueAndChannel } = require('../../utils/musicUtils');

module.exports = {
  category: 'music',
  data: new SlashCommandBuilder()
    .setName('back')
    .setDescription('Go back a song in the queue'),
  async execute(interaction) {
    const history = useHistory(interaction.guild.id);

    if (!history || history.isEmpty()) {
      return interaction.reply({
        content: 'No song to go back to!',
        ephemeral: true,
      });
    }

    const check = await ensureActiveQueueAndChannel(interaction);
    if (!check) return;

    await history.previous(true);

    return interaction.reply('Let\'s run that last one back!');
  }
}
