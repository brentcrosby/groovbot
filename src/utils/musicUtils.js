const { useQueue } = require('discord-player');

async function replyValidationError(interaction, content) {
  if (interaction.deferred) {
    await interaction.editReply({ content });
  } else if (interaction.replied) {
    await interaction.followUp({ content, ephemeral: true });
  } else {
    await interaction.reply({ content, ephemeral: true });
  }
}

/**
 * Checks if the user is in a voice channel.
 * @param {Interaction} interaction - The Discord interaction.
 * @returns {boolean} - True if the user is in a voice channel, false otherwise.
 */
function isUserInVoiceChannel(interaction) {
  if(!interaction.member.voice.channel){
    return false
  };
  return true;
}

/**
 * Checks if there's an active music queue in the guild.
 * @param {Interaction} interaction - The Discord interaction.
 * @returns {boolean} - True if there's an active queue, false otherwise.
 */
function hasActiveQueue(interaction) {
  const queue = useQueue(interaction.guild.id);
  if (!queue) {
    return false;
  }
  return true;
}

/**
 * Sends an error message if the user is not in a voice channel.
 * @param {Interaction} interaction - The Discord interaction.
 * @returns {Promise<boolean>} - Returns true if the user is in a voice channel, false otherwise.
 */
async function ensureUserInVoiceChannel(interaction) {
  if (!isUserInVoiceChannel(interaction)) {
    await replyValidationError(interaction, 'You need to be in a voice channel to use this command.');
    return false;
  }
  return true;
}

/**
 * Sends an error message if there's no active music queue.
 * @param {Interaction} interaction - The Discord interaction.
 * @returns {Promise<boolean>} - Returns true if there is an active queue, false otherwise.
 */
async function ensureActiveQueue(interaction) {
  if (!hasActiveQueue(interaction)) {
    await replyValidationError(interaction, 'There is no music currently playing.');
    return false;
  }
  return true;
}

/**
 * Sends an error message if the user is not in a voice channel or there's no active music queue.
 * @param {Interaction} interaction - The Discord interaction.
 * @returns {Promise<boolean>} - Returns true if both validations pass, false otherwise.
 */
async function ensureActiveQueueAndChannel(interaction) {
  if (!(await ensureUserInVoiceChannel(interaction))) {
    return false;
  }

  if (!(await ensureActiveQueue(interaction))) {
    return false;
  }

  return true;
}

module.exports = {
  isUserInVoiceChannel,
  hasActiveQueue,
  ensureUserInVoiceChannel,
  ensureActiveQueue,
  ensureActiveQueueAndChannel,
};
