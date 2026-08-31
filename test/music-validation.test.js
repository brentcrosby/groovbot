const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');

const rootPath = path.join(__dirname, '..');
const musicUtilsPath = path.join(rootPath, 'src/utils/musicUtils.js');
const removeCommandPath = path.join(rootPath, 'src/commands/music/remove.js');
const skipToCommandPath = path.join(rootPath, 'src/commands/music/skip-to.js');
const playNextCommandPath = path.join(rootPath, 'src/commands/music/play-next.js');
const loadEventsPath = path.join(rootPath, 'src/loaders/loadEvents.js');

function clearCachedProjectModules() {
  const eventsPath = path.join(rootPath, 'src/events') + path.sep;

  delete require.cache[musicUtilsPath];
  delete require.cache[removeCommandPath];
  delete require.cache[skipToCommandPath];
  delete require.cache[playNextCommandPath];
  delete require.cache[loadEventsPath];

  for (const cachedPath of Object.keys(require.cache)) {
    if (cachedPath.startsWith(eventsPath)) {
      delete require.cache[cachedPath];
    }
  }
}

class SlashCommandBuilder {
  setName() {
    return this;
  }

  setDescription() {
    return this;
  }

  addIntegerOption(buildOption) {
    buildOption(new SlashCommandOption());
    return this;
  }

  addStringOption(buildOption) {
    buildOption(new SlashCommandOption());
    return this;
  }

  addBooleanOption(buildOption) {
    buildOption(new SlashCommandOption());
    return this;
  }
}

class SlashCommandOption {
  setName() {
    return this;
  }

  setDescription() {
    return this;
  }

  setRequired() {
    return this;
  }
}

async function withMockedModules(discordPlayer, callback) {
  const originalLoad = Module._load;

  Module._load = function(request, parent, isMain) {
    if (request === 'discord-player') {
      return discordPlayer;
    }

    if (request === 'discord.js') {
      return {
        Events: {
          ClientReady: 'ready',
          InteractionCreate: 'interactionCreate'
        },
        SlashCommandBuilder
      };
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  clearCachedProjectModules();

  try {
    return await callback();
  } finally {
    Module._load = originalLoad;
    clearCachedProjectModules();
  }
}

function makeInteraction({ position, query = 'search query', saveQueue = false, inVoiceChannel = true, deferred = false, replied = false } = {}) {
  const replies = [];
  const editReplies = [];
  const followUps = [];
  const deferredReplies = [];

  const interaction = {
    guild: { id: 'guild-id' },
    member: {
      voice: {
        channel: inVoiceChannel ? { id: 'voice-channel-id' } : null
      }
    },
    user: { id: 'user-id' },
    deferred,
    replied,
    options: {
      getInteger: () => position,
      getString: () => query,
      getBoolean: () => saveQueue
    },
    replies,
    editReplies,
    followUps,
    deferredReplies,
    deferReply: async () => {
      deferredReplies.push(undefined);
      interaction.deferred = true;
    },
    editReply: async (message) => {
      editReplies.push(message);
    },
    reply: async (message) => {
      replies.push(message);
    },
    followUp: async (message) => {
      followUps.push(message);
      replies.push(message);
    }
  };

  return interaction;
}

test('ensureActiveQueueAndChannel stops after the voice-channel validation fails', async () => {
  let useQueueCalls = 0;
  const discordPlayer = {
    useQueue: () => {
      useQueueCalls += 1;
      return { size: 1 };
    }
  };

  await withMockedModules(discordPlayer, async () => {
    const { ensureActiveQueueAndChannel } = require(musicUtilsPath);
    const interaction = makeInteraction({ inVoiceChannel: false });

    const result = await ensureActiveQueueAndChannel(interaction);

    assert.equal(result, false);
    assert.equal(useQueueCalls, 0);
    assert.equal(interaction.replies.length, 1);
    assert.deepEqual(interaction.replies[0], {
      content: 'You need to be in a voice channel to use this command.',
      ephemeral: true
    });
  });
});

test('ensureActiveQueueAndChannel resolves deferred validation errors with editReply', async () => {
  const discordPlayer = {
    useQueue: () => null
  };

  await withMockedModules(discordPlayer, async () => {
    const { ensureActiveQueueAndChannel } = require(musicUtilsPath);
    const interaction = makeInteraction({ deferred: true });

    const result = await ensureActiveQueueAndChannel(interaction);

    assert.equal(result, false);
    assert.deepEqual(interaction.editReplies, [
      { content: 'There is no music currently playing.' }
    ]);
    assert.deepEqual(interaction.followUps, []);
    assert.deepEqual(interaction.replies, []);
  });
});

test('/remove rejects out-of-range one-based track numbers without removing a queue item', async () => {
  let removedIndex;
  const queue = {
    size: 2,
    node: {
      remove: (index) => {
        removedIndex = index;
      }
    }
  };

  await withMockedModules({ useQueue: () => queue }, async () => {
    const remove = require(removeCommandPath);
    const interaction = makeInteraction({ position: 0 });

    await remove.execute(interaction);

    assert.equal(removedIndex, undefined);
    assert.equal(interaction.replies.length, 1);
    assert.equal(interaction.replies[0], "Please provide a track number between 1 and 2. Use the queue command to see what's in there.");
  });
});

test('/skip-to rejects out-of-range one-based track numbers without jumping or skipping', async () => {
  let jumpedIndex;
  let skippedIndex;
  const queue = {
    size: 2,
    node: {
      jump: (index) => {
        jumpedIndex = index;
      },
      skipTo: (index) => {
        skippedIndex = index;
      }
    }
  };

  await withMockedModules({ useQueue: () => queue }, async () => {
    const skipTo = require(skipToCommandPath);
    const interaction = makeInteraction({ position: -1, saveQueue: false });

    await skipTo.execute(interaction);

    assert.equal(jumpedIndex, undefined);
    assert.equal(skippedIndex, undefined);
    assert.equal(interaction.replies.length, 1);
    assert.equal(interaction.replies[0], "Please provide a track number between 1 and 2. Use the queue command to see what I've got coming up!");
  });
});

test('/play-next starts an idle queue with queue.node.play and no arguments', async () => {
  const playCalls = [];
  const insertedTracks = [];
  const queue = {
    size: 1,
    node: {
      play: async (...args) => {
        playCalls.push(args);
      }
    },
    insertTrack: (track, index) => {
      insertedTracks.push({ track, index });
    },
    isPlaying: () => false
  };
  const player = {
    search: async () => ({
      tracks: ['track-result'],
      hasTracks: () => true
    })
  };

  await withMockedModules({ useQueue: () => queue, useMainPlayer: () => player }, async () => {
    const playNext = require(playNextCommandPath);
    const interaction = makeInteraction({ query: 'track query' });

    await playNext.execute(interaction);

    assert.deepEqual(insertedTracks, [{ track: 'track-result', index: 0 }]);
    assert.deepEqual(playCalls, [[]]);
    assert.deepEqual(interaction.editReplies, ['Next up **track-result**!']);
  });
});

test('loadEvents skips invalid event modules instead of registering undefined handlers', async () => {
  const clientRegistrations = [];
  const playerRegistrations = [];
  const warnings = [];
  const originalWarn = console.warn;

  try {
    console.warn = (message) => {
      warnings.push(message);
    };

    await withMockedModules({}, async () => {
      const loadEvents = require(loadEventsPath);
      const client = {
        once: (name, execute) => clientRegistrations.push({ name, execute, once: true }),
        on: (name, execute) => clientRegistrations.push({ name, execute, once: false })
      };
      const player = {
        events: {
          on: (name, execute) => playerRegistrations.push({ name, execute })
        }
      };

      loadEvents(client, player);
    });
  } finally {
    console.warn = originalWarn;
  }

  assert.deepEqual(clientRegistrations.map((event) => event.name).sort(), ['interactionCreate', 'ready']);
  assert.deepEqual(playerRegistrations.map((event) => event.name).sort(), ['disconnect', 'playerStart']);
  assert.ok(clientRegistrations.every((event) => typeof event.execute === 'function'));
  assert.ok(playerRegistrations.every((event) => typeof event.execute === 'function'));
  assert.ok(warnings.some((message) => message.includes('audioTrackAdd.js')));
});
