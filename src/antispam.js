const { Client, Message } = require('discord.js');

function msgCatch(error) {
    console.error(error.stack);
}

const link_regex = /(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/[^\s]*)?/g;
// https://stackoverflow.com/questions/16699007/regular-expression-to-match-standard-10-digit-phone-number
const number_regex = /(?<=( |^))(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-‑]?\d{3}[\s.-‑]?\d{4}/gm;


/**
 * @param {Client} bot
 * @param {Message} message
 
 */
const notifyStaff = async (bot, message) => {
    if (!process.env.ADMIN_CHANNEL_ID) return;
    const channel = bot.channels.cache.get(process.env.ADMIN_CHANNEL_ID);
    const content = (message.content.replace(/@(here|everyone)/g, '$1').replace(link_regex, '<$&>'));
    if (channel && channel.isTextBased())
        await channel.send(`Kicked suspected spam: ${message.member.displayName}\nContent: ||${content}||`);
};

const linkMessages = new Map();

/**
 * @param {Message} msg
 * @param {string} link
 */
function setNewLink(msg, link) {
    linkMessages.set(msg.author.id, {
      link,
      ids: [{
        channel: msg.channel.id,
        message: msg.id
      }]
    });
  }
  
/**
 * @param {Client} bot
 * @param {Message} msg
 */
function checkSpam(bot, msg) {
    if (/@(here|everyone)/.test(msg.content) && (link_regex.test(msg.content) || number_regex.test(msg.content))) {
      if (msg.member.kickable) {
        msg.member.kick('Spammed same link. Typically spam bot behavior.')
        .then(async () => await notifyStaff(bot, msg))
        .then(async () => {
          if (msg.deletable) await msg.delete();
        })
        .catch(msgCatch);
      }
      return true;
    }
  
    if (msg.content.includes('chaoticrecode') || (!link_regex.test(msg.content) && !number_regex.test(msg.content))) {
      if (linkMessages.has(msg.author.id)) {
        const { ids, link } = linkMessages.get(msg.author.id);
        if (ids.length > 1) {
          ids.pop();
          linkMessages.set(msg.author.id, { ids, link });
        }
        else {
          linkMessages.delete(msg.author.id);
        }
      }
      return false;
    }
  
    const new_link = (msg.content.match(link_regex) ?? msg.content.match(number_regex))[0];
    if (linkMessages.has(msg.author.id)) {
      const { link, ids } = linkMessages.get(msg.author.id);
      if (new_link.localeCompare(link) === 0) {
        ids.push({
          channel: msg.channel.id,
          message: msg.id
        });
        if (ids.length >= 3) {
          if (msg.member.kickable) {
            msg.member.kick('Spammed same link. Typically spam bot behavior.')
            .then(async () => await notifyStaff(bot, msg))
            .then(async () => {
              for (const { channel, message } of ids) {
                const chan = bot.channels.cache.get(channel);
                if (chan && chan.isTextBased()) {
                    await chan.messages.fetch(message).then(async (v) => {
                        if (v.deletable) await v.delete();
                    });
                }
              }
            })
            .catch(msgCatch);
          }
        }
        else {
          linkMessages.set(msg.author.id, { link, ids });
        }
      }
      else {
        setNewLink(msg, new_link);
      }
    }
    else {
      setNewLink(msg, new_link);
    }
  
    return true;
}
  
module.exports = { checkSpam };
