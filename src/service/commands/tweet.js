const Any = require('../../api/models/any.model');

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
      { sort: { id: -1 } });
    let id = false;
    if (item) {
      item = item.toObject();
      id = item.id;
    }
    if (item) {
      await Promise.all([
        AnyM.bulkWrite([
          {
            updateOne: {
              filter: { id },
              update: { posted: true },
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
