const Any = require('../../api/models/any.model');
const { tweetsList } = require('../utils/tweets');

//statuses/show/:id
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
      //console.log(botHelper.browserWs);
      let s = {};
      /*if (botHelper.browserWs) s = await puppet(
        `https://twitter.com/${twUser}/status/${id_str}`, botHelper.browserWs);*/
      //console.log(s);
      if (s && s.text) {
        item.text = s.text;
      }
      const tweet = await tweetsList('', id_str);
      //console.log(tweet);
      if (tweet) {
        item.text = tweet.full_text;
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
        botHelper.sendAdmin(item.text, tgChan),
      ]);
      await botHelper.sendAdmin(`new tweet ${id}`);
    }
  } catch (e) {
    console.log(e);
  }
}

module.exports = { run };
