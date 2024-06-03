const { Client, Events, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { checkSpam } = require('./antispam');
require('dotenv').config();

if (!process.env.DISCORD_BOT_TOKEN) {
    throw new Error('No token provided');
}

if (!process.env.ADMIN_CHANNEL_ID) {
    console.log('No admin channel provided - will not notify staff of spam.');
}

const client = new Client({ 
    intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages ], 
    partials: [ Partials.Channel ]
});

client.once(Events.ClientReady, readyClient => {
	console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    checkSpam(client, message);
});


/* Windows pick up sigint */
if (process.platform === 'win32') {
    var rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
  
    rl.on('SIGINT', function () {
      process.kill(process.pid, 'SIGINT');
    });
}
  
const exit = async () => {
    process.exit();
};

process.once('SIGINT', exit);
process.once('SIGTERM', exit);
