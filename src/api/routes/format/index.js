const url = require('url');
const messages = require('../../../messages/format');
const keyboards = require('./keyboards');
const db = require('../../utils/db');

const rabbitmq = require('../../../service/rabbitmq');
rabbitmq.createChannel();



const support = ({ message, reply }, botHelper) => {
  let system = JSON.stringify(message.from);
  try {
    const sup = [
      process.env.SUP_LINK,
      process.env.SUP_LINK1,
      process.env.SUP_LINK2,
      process.env.SUP_LINK3,
    ];
    reply(messages.support(sup), {
      ...keyboards.hide(),
      disable_web_page_preview: true,
    }).catch(e => botHelper.sendError(e));
  } catch (e) {
    system = `${e}${system}`;
  }
  botHelper.sendAdmin(`support ${system}`);
};

const startOrHelp = ({ message, reply }, botHelper) => {
  let system = JSON.stringify(message.from);
  try {
    reply(messages.start(), keyboards.start()).catch(
      e => botHelper.sendError(e));
  } catch (e) {
    system = `${e}${system}`;
  }
  botHelper.sendAdmin(system);
};
const broadcast = ({ message: msg, reply }, botHelper) => {
  const { chat: { id: chatId }, text } = msg;
  const isAdm = botHelper.isAdmin(chatId);
  if (isAdm) {
    return db.processBroadcast(text, reply, botHelper);
  }
};
module.exports = (bot, botHelper) => {
  bot.command(['/start', '/help'], ctx => startOrHelp(ctx, botHelper));
  bot.command(['/createBroadcast', '/startBroadcast'],
    ctx => broadcast(ctx, botHelper));
  bot.hears('👋 Help', ctx => startOrHelp(ctx, botHelper));
  bot.hears('👍Support', ctx => support(ctx, botHelper));
  bot.command('support', ctx => support(ctx, botHelper));
  bot.hears('⌨️ Hide keyboard', ({ reply }) => {
    reply('Type /help to show.', keyboards.hide()).catch(
      e => botHelper.sendError(e));
  });

};
