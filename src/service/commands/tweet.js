const Any = require('../../api/models/any.model');
const { tweetsList } = require('../utils/tweets');

async function run(params, botHelper) {
  try {
    const tgChan = process.env.TWCH;
    const twUser = process.env.TWUS;
    if (!tgChan || !twUser) {
      return;
    }
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
      const id_str = item.id_str;
      let s = {};
      if (s && s.text) {
        item.text = s.text;
      }
      const tweet = await tweetsList('', id_str);
      let type = false;
      if (tweet) {
        item.text = tweet.full_text;
        let mark = false;
        if (tweet.entities && tweet.entities.urls &&
          tweet.entities.urls.length === 1) {
          const url = tweet.entities.urls[0].url;
          const display_url = tweet.entities.urls[0].display_url;
          const expanded_url = tweet.entities.urls[0].expanded_url;
          item.text = item.text.replace(url,
            `[${display_url}](${expanded_url})`);
          type = true;
        }
        if (tweet.entities && tweet.entities.media &&
          tweet.entities.media.length === 1 && tweet.entities.media[0].type ===
          'photo') {
          item.text = item.text.replace(tweet.entities.media[0].url, '');
          mark = type
          type = {
            type: 'photo',
            src: tweet.entities.media[0].media_url_https,
          };
          if (mark) type.extra = { parse_mode: 'Markdown' };
        }
      }
      await Promise.all([
        AnyM.bulkWrite([
          {
            updateOne: {
              filter: { id },
              update: { posted: params.test ? false : true },
              upsert: true,
            },
          },
        ]),
        botHelper.sendAdmin(item.text, tgChan, type),
      ]).catch(e => botHelper.sendAdmin(JSON.stringify(e)));
      await botHelper.sendAdmin(`new tweet ${id}`);
    }
  } catch (e) {
    console.log(e);
  }
}

module.exports = { run };
