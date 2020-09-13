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
    const items = await AnyM.findOne({ id: { $exists: true } }, '',
      { sort: { id: -1 } });
    let since_id = false;
    if (items) since_id = items.toObject().id;
    const tweets = await tweetsList(twUser, since_id);
    if (tweets && tweets.length) await AnyM.bulkWrite(tweets.map(i => ({
      updateOne: {
        filter: { id: i.id },
        update: i,
        upsert: true,
      },
    })));
    await botHelper.sendAdmin(`new tweets ${tweets.length}`);
  } catch (e) {
    console.log(e);
  }
}

module.exports = { run };
