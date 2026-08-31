const fs = require('node:fs');
const path = require('node:path');

function loadEventModule(filePath, file) {
    const event = require(filePath);

    if (!event || typeof event.name !== 'string' || event.name.length === 0 || typeof event.execute !== 'function') {
        console.warn(`Skipping invalid event module ${file}: missing name or execute function.`);
        return null;
    }

    return event;
}

module.exports = (client, player) => {
    const eventsPath = path.join(__dirname, '../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = loadEventModule(filePath, file);

        if (!event) {
            continue;
        }

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }

    // Load Player events (if you have them in a separate folder like 'events/player')
    const playerEventsPath = path.join(__dirname, '../events/player');
    const playerEventFiles = fs.readdirSync(playerEventsPath).filter(file => file.endsWith('.js'));

    for (const file of playerEventFiles) {
        const filePath = path.join(playerEventsPath, file);
        const event = loadEventModule(filePath, file);

        if (!event) {
            continue;
        }

        player.events.on(event.name, (...args) => event.execute(...args));
    }
};
