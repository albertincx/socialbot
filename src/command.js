Promise = require('bluebird'); // eslint-disable-line no-global-assign
const path = require('path');

const mongoose = require('./config/mongoose');
const cmdParsed = require('./service/cmdParser');
const Utils = require('./service/utils');

const connection = mongoose.connect();
cmdParsed.APP_PATH = path.join(__dirname, '../');
cmdParsed.IMAGES_DIR = path.join(__dirname, '../images');
cmdParsed.TMP_PATH_LOCAL = path.join(__dirname, '../tmp');

function _log(str) {
  console.log(str);
}

const botMock = {
  sendAdmin: (txt) => {
    console.log('btn adm ', txt);
  },
};
(async () => {
  _log('start command', cmdParsed);
  let cmd = null;
  Utils.showMem();
  console.time('start');
  try {
    cmd = require(`./service/commands/${cmdParsed.cmd}`);
    if (cmd && typeof cmd.run !== 'undefined') {
      cmd.c = connection;
      const error = await cmd.run(cmdParsed, botMock);
      if (error) {
        _log('\x1b[36m%s\x1b[0m', error);
      }
    }
  } catch (e) {
    _log(e);
  }
  console.timeEnd('start');
  Utils.showMem();
  connection.close(() => _log('closed'));
})();
