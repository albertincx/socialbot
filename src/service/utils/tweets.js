var fs = require('fs');
var OAuth = require('oauth');

var AT = process.env.TWAT;
var AST = process.env.TWAS;
var CK = process.env.TWAK;
var CS = process.env.TWAKS;
var reqUrl = 'https://api.twitter.com/oauth/request_token';
var accUrl = 'https://api.twitter.com/oauth/access_token';

function tweetsList(username, since_id = false) {
  return new Promise((resolve, reject) => {
    var oauth = new OAuth.OAuth(reqUrl, accUrl, CK, CS, '1.0A', null,
      'HMAC-SHA1');

    var screen_name = username;
    const params = [
      'include_rts=0',
      'exclude_replies=1',
      'count=10',
      'screen_name=' + screen_name,
    ];
    if (since_id) {
      params.push(`since_id=${since_id}`);
    }
    let url = 'https://api.twitter.com/1.1/statuses/';
    if (!username && since_id) {
      url += 'show.json?id=' + since_id;
    } else {
      url += 'user_timeline.json?' + params.join('&');
    }
    oauth.get(url, AT, AST, function(e, data, result) {
      if (e) {
        reject(e);
        return;
      }
      const d = JSON.parse(data);
      // fs.writeFileSync(__dirname + '/tws.json', JSON.stringify(d, null, 2));
      resolve(d);
    });
  });
}

exports.tweetsList = tweetsList;
