const express = require('express');

const { NOBOT, PORT, blacklistFile } = require('./config/vars');
const mongoose = require('./config/mongoose');
const botroute = require('./api/routes/botroute');
const api = require('./api/routes/api');
const init = require('./cron');
const puppet = require('./service/utils/browser');
const conn = mongoose.connect();
const app = express();
app.get('/', (req, res) => res.send('use telegram bot <a href="tg://resolve?domain=CorsaBot">@CorsaBot</a>'));
app.use(api);
if (!NOBOT && process.env.TBTKN) {
  const botInstance = require('./config/bot');
  if (botInstance) {
    const { router, bot } = botroute(botInstance, conn);
    bot.browserWs = null;
    if (!bot.config.nopuppet && !process.env.NOPUPPET) {
      puppet.getBrowser().then(ws => {
        bot.browserWs = ws;
      });
    }
    init(bot);
    bot.setBlacklist(blacklistFile);
    app.use('/bot', router);
  }
}

app.listen(PORT, () => console.info(`server started on port ${PORT}`));
module.exports = app;
