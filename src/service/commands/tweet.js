const Any = require('../../api/models/any.model');
const { tweetsList } = require('../utils/tweets');

function extendedEntities(extended_entities) {
  let vcap = { vcap: false };
  if (extended_entities.media && extended_entities.media.length) {
    if (extended_entities.media[0]) {
      if (extended_entities.media[0] && extended_entities.media[0].video_info) {
        const variants = extended_entities.media[0].video_info.variants || [];
        let url = '';
        if (Array.isArray(variants)) {
          let d = 0;
          for (let vi = 0; vi < variants.length; vi += 1) {
            if ('video/mp4' === variants[vi].content_type) {
              if (d < variants[vi].bitrate) {
                d = variants[vi].bitrate;
                url = variants[vi].url;
              }
            }
          }
        }
        if (url) {
          vcap.vcap = url;
          vcap.vurl = extended_entities.media[0].url;
        }
      }
    }
  }
  return vcap;
}

function userMentions(text, user_mentions) {
  if (user_mentions && user_mentions.length) {
    for (let i = 0; i < user_mentions.length; i += 1) {
      text = text.replace(new RegExp(`@${user_mentions[i].screen_name}`),
        `https://twitter.com/${user_mentions[i].screen_name}`);
    }
  }
  return text;
}

async function run(params, botHelper) {
  try {
    const tgChan = process.env.TWCH;
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
      const id_str = item.id_str;
      let s = {};
      if (s && s.text) {
        item.text = s.text;
      }
      const tweet = await tweetsList('', id_str);
      let type = false;
      //console.log(JSON.stringify(tweet, null, 2));
      if (tweet) {
        item.text = tweet.full_text;
        let mark = false;
        if (tweet.entities) {
          if (tweet.entities.user_mentions) item.text = userMentions(item.text,
            tweet.entities.user_mentions);
          let videoCaption = false;
          if (tweet.extended_entities) {
            const { vcap, vurl } = extendedEntities(tweet.extended_entities);
            videoCaption = vcap;
            if (videoCaption && vurl) {
              item.text = item.text.replace(vurl, '');
            }
          }
          if (tweet.entities.urls &&
            tweet.entities.urls.length === 1) {
            const url = tweet.entities.urls[0].url;
            const display_url = tweet.entities.urls[0].display_url;
            const expanded_url = tweet.entities.urls[0].expanded_url;
            // item.text = item.text.replace(url,            `[${display_url}](${expanded_url})`);
            // item.text = item.text.replace(url, expanded_url);
            if (item.text.match(/[^\r\n]http(.*?)$/)) {
              item.text = item.text.replace('https', '\r\nhttps');
            }
            // type = true;
          }
          if (tweet.entities.media &&
            tweet.entities.media.length === 1 &&
            tweet.entities.media[0].type ===
            'photo' && !videoCaption) {
            item.text = item.text.replace(tweet.entities.media[0].url, '');
            mark = type;
            type = {
              type: 'photo',
              src: tweet.entities.media[0].media_url_https,
            };
            if (mark) type.extra = { parse_mode: 'Markdown' };
          }
          if (videoCaption) {
            type = {
              type: 'video',
              src: videoCaption,
            };
          }
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
    botHelper.sendAdmin(`srv: ${JSON.stringify(e)}`, process.env.TGGROUPBUGS);
    console.log(e);
  }
}

module.exports = { run };
