const Any = require('../../api/models/any.model');
const { tweetsList } = require('../utils/tweets');
const { puppet } = require('../utils/puppet');

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
      const s = await puppet(`https://twitter.com/${twUser}/status/${id_str}`, botHelper.browserWs);
      //console.log(s);
      if (s && s.text) {
        item.text = s.text;
      } else {
        //const tweet = await tweetsList('', id);
        //console.log(tweet);
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
