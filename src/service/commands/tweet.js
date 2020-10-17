const Any = require('../../api/models/any.model');
const { tweet } = require('../utils/tweet');

async function run(params, botHelper) {
  try {
    let tgChan = process.env.TWCH;
    let isModer = process.env.ISMODER;
    if (isModer) tgChan = process.env.TWUSMODER;
    const twUser = process.env.TWUS;
    if (!tgChan || !twUser) return;
    const AnyM = Any.collection.conn.model('twitts', Any.schema);
    let item = await AnyM.findOne(
      {
        id: { $exists: true },
        'user.screen_name': twUser,
        $or: [{ posted: false }, { posted: { $exists: false } }],
      },
      '',
      { sort: { id: 1 } });
    let id = false;
    if (item) {
      item = item.toObject();
      id = item.id;
      const exists = await AnyM.findOne({ id, posted: true });
      if (exists) return false;
      await AnyM.bulkWrite([
        {
          updateOne: {
            filter: { id },
            update: { posted: params.test ? false : true },
            upsert: true,
          },
        },
      ]);
      const id_str = item.id_str;
      let s = {};
      if (s && s.text) item.text = s.text;
      let { itemText, itemType } = await tweet(id_str);
      let type = false;
      if (itemText) {
        item.text = itemText;
        type = itemType;
      }
      let errStr = '';
      if (isModer) {
        item.text = `❗️Модерация\n\n${item.text}
        \n/postTweet_${id_str} Нажмите сюда чтобы опубликовать`;
      }
      await botHelper.sendAdmin(item.text, tgChan, type).catch(e => {
        errStr += JSON.stringify(e);
      });
      const s2 = `new tweet ${id} ${errStr ? `with err ${errStr}` : ''}`;
      await botHelper.sendAdmin(s2);
    }
  } catch (e) {
    botHelper.sendAdmin(`srv: ${JSON.stringify(e)}`, process.env.TGGROUPBUGS);
    console.log(e);
  }
}

module.exports = { run };
