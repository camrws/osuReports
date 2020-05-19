const Redis = require('ioredis');
const _ = require('lodash');
const osuApi = require('./osuApi');
const globalInstances = require('./globalInstances');

const USER_PREFIX = 'usercache:';
const USER_CACHE_TIME = 24 * 60 * 60;

/**
 * @typedef {'username' | 'id'} UserForm
 */

class UserCache {
  constructor(options) {
    options = _.merge({
      host: 'localhost',
      port: 6379,
    });

    this.client = new Redis(options);
  }

  /**
   * @param {any} osuUsernameOrId - the osu user name or user id that needs to be converted
   * @param {UserForm} requestedForm - boolean for telling the function what the requested form is
   */

  static async convertOsuUser(osuUsernameOrId, requestedForm) {
    if (
      (requestedForm === 'id' && isNaN(osuUsernameOrId)) ||
      (requestedForm === 'username' && !isNaN(osuUsernameOrId))
    ) {
      //already is a user name not a user id so don't call api
      return osuUsernameOrId;
    } else {
      return getRequestedForm();
    }

    async function getRequestedForm() {
      return osuApi
        .getUser({ u: osuUsernameOrId })
        .then((user) => (requestedForm === 'id' ? user.id : user.name))
        .catch((err) => {
          globalInstances.logMessage('Failed to fetch user information', err);
          return null;
        });
    }
  }

  async getOsuUser(osuId) {
    const key = USER_PREFIX + osuId;

    let username;
    try {
      username = await this.client.get(key);
      return username;
    } catch (ex) {}

    // not cached
    username = await UserCache.convertOsuUser(osuId, 'username');
    await this.client.setex(key, USER_CACHE_TIME, username);
    return username;
  }

  async updateOsuUser(osuId, osuUsername) {
    const key = USER_PREFIX + osuId;
    await this.client.setex(key, USER_CACHE_TIME, osuUsername);
  }
}

module.exports = new UserCache({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});