const Twit = require("twit");
const {
  consumer_key,
  consumer_secret,
  access_token,
  access_token_secret
} = require("@osureport/common/lib/consumerKeys");

const hasKeys =
  consumer_key && consumer_secret && access_token && access_token_secret;

/** @type {Twit} */
let T;

if (hasKeys) {
  T = new Twit({
    consumer_key,
    consumer_secret,
    access_token,
    access_token_secret
  });
} else {
  console.warn("WARNING: NO TWITTER KEYS, RUNNING WITHOUT TWEET CAPABILITY");
  T = new Proxy(
    {},
    {
      get() {
        return () =>
          Promise.resolve({
            data: {
              media_id_string: "testMediaID",
              id_str: "testTweetID"
            },
            __fake__: true
          });
      }
    }
  );
}

module.exports = T;
