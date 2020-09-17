const fs = require('fs');
const TGADMIN = parseInt(process.env.TGADMIN);
const _OFF = 'Off';
const _ON = 'On';

class BotHelper {
  constructor(bot) {
    this.bot = bot;
    let c = {};
    try {
      c = JSON.parse(`${fs.readFileSync('.conf/config.json')}`);
    } catch (e) {
    }
    this.config = c;
  }

  isAdmin(chatId) {
    return chatId === TGADMIN;
  }

  botMes(chatId, text, mark = true) {
    let opts = {};
    if (mark) {
      opts = { parse_mode: 'Markdown' };
    }
    return this.bot.sendMessage(chatId, text, opts).
      catch(e => this.sendError(e, `${chatId}${text}`));
  }

  sendVideo(src, chatId = TGADMIN, extra) {
    return this.bot.sendVideo(chatId, src, extra);
  }

  sendPhoto(src, chatId = TGADMIN, extra) {
    return this.bot.sendPhoto(chatId, src, extra);
  }

  sendAdmin(text, chatId = TGADMIN, type = false) {
    let opts = {};
    let mark = false;
    if (typeof type === 'boolean') {
      mark = type;
    }
    if (typeof type === 'object') {
      if (type.type === 'photo') {
        const extra = type.extra || {};
        extra.caption = text;
        return this.sendPhoto(type.src, chatId, extra);
      }
      if (type.type === 'video') {
        const extra = type.extra || {};
        extra.caption = text;
        return this.sendVideo(type.src, chatId, extra);
      }
    }
    if (mark) {
      opts = {
        parse_mode: 'Markdown',
      };
    }
    if (chatId === null) {
      chatId = TGADMIN;
    }
    if (chatId === TGADMIN) {
      text = `service: ${text}`;
    }
    return this.bot.sendMessage(chatId, text, opts);
  }

  getParams(hostname, chatId, force) {
    let params = {};
    const contentSelector = force === 'content' ||
      this.getConf(`${hostname}_content`);
    if (contentSelector) {
      params.content = contentSelector;
    }
    const customOnly = force === 'custom' || this.getConf(`${hostname}_custom`);
    if (customOnly) {
      params.isCustom = true;
    }
    const wget = force === 'wget' || this.getConf(`${hostname}_wget`);
    if (wget) {
      params.isWget = true;
    }
    const cached = force === 'cached' || this.getConf(`${hostname}_cached`);
    if (cached) {
      params.isCached = true;
    }
    const scroll = this.getConf(`${hostname}_scroll`);
    if (scroll) {
      params.scroll = scroll;
    }
    const noLinks = force === 'nolinks' || this.getConf(`${hostname}_nolinks`);
    if (noLinks) {
      params.noLinks = true;
    }
    const pcache = force === 'pcache';
    if (pcache) {
      params.isCached = true;
      params.cachefile = 'puppet.html';
      params.content = this.getConf('pcache_content');
    }
    if (this.isAdmin(chatId)) {
      if (this.getConf('test_custom')) {
        params.isCustom = true;
      }
    }
    return params;
  }

  getConf(param) {
    let c = this.config[param] || '';
    if (c === _OFF) c = '';
    return c;
  }

  togglecConfig(msg) {
    let params = msg.text.replace('/cconfig', '').trim();
    if (!params || !this.isAdmin(msg.chat.id)) {
      return Promise.resolve('no param or forbidden');
    }
    let { param, content } = this.parseConfig(params);
    let c = {};
    c[param] = content;
    fs.writeFileSync(`.conf/custom/${param}.json`, JSON.stringify(c));
  }

  parseConfig(params) {
    let content = '';
    let param = '';
    let c = params.replace(' _content', '_content').split(/\s/);
    if (c.length === 2) {
      param = c[0];
      content = c[1].replace(/~/g, ' ');
    } else {
      param = c[0];
      if (this.config[param] === _ON) {
        content = _OFF;
      } else {
        content = _ON;
      }
    }
    return { param, content };
  }

  toggleConfig(msg) {
    let params = msg.text.replace('/config', '').trim();
    if (!params || !this.isAdmin(msg.chat.id)) {
      return Promise.resolve('no param or forbidden');
    }

    let { param, content } = this.parseConfig(params);
    this.config[param] = content;
    fs.writeFileSync('.conf/config.json', JSON.stringify(this.config));
    return this.botMes(TGADMIN, content, false);
  }

  sendError(e, text = '') {
    if (typeof e === 'object') {
      if (e.response && typeof e.response === 'object') {
        e = e.response.description || 'unknown error';
      }
    } else {
      e = `error: ${JSON.stringify(e)} ${e.toString()} ${text}`;
    }

    return this.sendAdmin(e);
  }

  disDb() {
    this.db = false;
  }

  setBlacklist(f) {
    this.bllist = fs.readFileSync(f).toString() || '';
  }

  forward(mid, from, to) {
    return this.bot.forwardMessage(to, from, mid);
  }
}

module.exports = BotHelper;
