const { tweetsList } = require('../utils/tweets');

function extendedEntities(extended_entities) {
  let vcap = { vcap: false, group: [] };
  let mediaGroup = [];
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
      } else {
        for (let vi = 0; vi < extended_entities.media.length; vi += 1) {
          if ('photo' === extended_entities.media[vi].type) {
            mediaGroup.push({
              type: 'photo',
              media: extended_entities.media[vi].media_url_https,
            });
          }
        }
      }
    }
  }
  if (mediaGroup.length > 1) {
    vcap.group = mediaGroup;
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

async function tweet(id_str) {
  const result = { itemText: '', itemType: false };
  try {
    let itemText = ''
    const tweet = await tweetsList('', id_str);
    let type = false;
    if (tweet) {
      itemText = tweet.full_text;
      let mark = false;
      if (tweet.entities) {
        if (tweet.entities.user_mentions) itemText = userMentions(itemText,
          tweet.entities.user_mentions);
        let videoCaption = false;
        let mediaGroup = [];
        if (tweet.extended_entities) {
          const { vcap, vurl, group } = extendedEntities(
            tweet.extended_entities);
          videoCaption = vcap;
          if (group) {
            mediaGroup = group;
          }
          if (videoCaption && vurl) {
            itemText = itemText.replace(vurl, '');
          }
        }
        if (tweet.entities.urls &&
          tweet.entities.urls.length === 1) {
          const url = tweet.entities.urls[0].url;
          const expanded_url = tweet.entities.urls[0].expanded_url;
          itemText = itemText.replace(url, expanded_url);
          if (itemText.match(/[^\r\n]http(.*?)$/)) {
            itemText = itemText.replace('https', '\r\nhttps');
          }
        }
        if (tweet.entities.media &&
          tweet.entities.media.length === 1 &&
          tweet.entities.media[0].type ===
          'photo' && !videoCaption) {
          itemText = itemText.replace(tweet.entities.media[0].url, '');
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
        } else {
          if (Array.isArray(mediaGroup) && mediaGroup.length) {
            type = {
              type: 'photos',
              src: mediaGroup,
            };
          }
        }
      }
    }

    result.itemText = itemText;
    result.itemType = type;
  } catch (e) {
    console.log(e);
  }
  return result;
}

module.exports.tweet = tweet;
