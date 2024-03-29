/**
 * @typedef {import('jimp/types/ts3.1/index')} Jimp
 */

const resourceGetter = require("./resourceGetter");
var UserCache = require("./userCache");

const {
  DrawTools,
  GENERAL_X_OFFSET,
  GENERAL_Y_OFFSET,
  LEVEL_BAR_X_OFFSET,
  LEVEL_BAR_Y_OFFSET,
  RANK_X_OFFSET,
  RANK_Y_OFFSET
} = require("./drawTools");
const PlayImage = require("./playImage");

class Report extends DrawTools {
  /**
   *
   * @param {Jimp} template
   * @param {*} player
   * @param {*} user
   * @param {*} sessionDuration
   * @param {*} date
   * @param {*} delta
   */
  constructor(template, player, user, sessionDuration, date, delta) {
    super(template);

    this.player = player;
    this.user = user;
    this.sessionDuration = sessionDuration;
    this.date = date;
    this.delta = delta;
  }

  get globalRank() {
    return "#" + parseFloat(this.user.pp.rank).toLocaleString("en");
  }

  get countryRank() {
    return "#" + parseFloat(this.user.pp.countryRank).toLocaleString("en");
  }

  get accuracy() {
    return parseFloat(this.user.accuracy).toFixed(2) + "%";
  }

  get pp() {
    return parseFloat(this.user.pp.raw).toLocaleString("en");
  }

  get plays() {
    return parseFloat(this.user.counts.plays).toLocaleString("en");
  }

  async generate() {
    await this._drawRanks();
    await this._drawAvatar();
    await this._drawFlag();
    await this._drawSessionInfo();
    await this._drawSessionFields();
    await this._drawDifferences();
    await this._drawLevels();
    return this.image;
  }

  async _drawRanks() {
    await this._drawCommands(
      this._drawRank,
      [],
      ["rankSSPlus", 220, 305],
      ["rankSS", 340, 305],
      ["rankSPlus", 460, 305],
      ["rankS", 580, 305],
      ["rankA", 700, 305]
    );

    const { SSH, SS, SH, S, A } = this.user.counts;
    await this._drawCommands(
      this._printRanks,
      ["ubuntuBBlack24"],
      [280, 365 + RANK_Y_OFFSET, SSH],
      [400, 365 + RANK_Y_OFFSET, SS],
      [520, 365 + RANK_Y_OFFSET, SH],
      [640, 365 + RANK_Y_OFFSET, S],
      [760, 365 + RANK_Y_OFFSET, A]
    );
  }

  async _drawRank(resource, x, y) {
    this.image.composite(
      await resourceGetter.getImage(resource),
      x + RANK_X_OFFSET,
      y + RANK_Y_OFFSET
    );
  }

  async _drawAvatar() {
    const avatar = await resourceGetter.getPlayerAvatar(this.user.id);
    const circleMask = await resourceGetter.getImage("circleMask");
    avatar.mask(circleMask, 0, 0);
    this.image.composite(avatar, 25, 25);
  }

  async _drawFlag() {
    const flag = await resourceGetter.getPlayerCountryFlag(this.user.country);
    this.image.composite(flag, 83, 308);
  }

  async _drawSessionInfo() {
    await this._drawCommands(
      this._print,
      ["ubuntuBBlack32"],
      [25, 450, `Session Duration: ${this.sessionDuration}`],
      [502, 450, `Date of Session: ${this.date}`]
    );
  }

  async _drawSessionFields() {
    await this._drawCommands(
      this._printOffset,
      ["ubuntuBBlue32"],
      [326, 100, "Global Rank:"],
      [300, 140, "Country Rank:"],
      [371, 180, "Accuracy:"],
      [466, 220, "PP:"],
      [341, 260, "Play Count:"]
    );

    await this._drawCommands(
      this._printOffset,
      // with black font at x-offset 522
      ["ubuntuBBlack32", 522],
      [100, this.globalRank],
      [140, this.countryRank],
      [180, this.accuracy],
      [220, this.pp],
      [260, this.plays]
    );
    let osuUsername = await UserCache.getOsuUser(this.player.osuUsername);
    await this._printCenteredX(
      "ubuntuBBlack32",
      505 + GENERAL_X_OFFSET,
      28 + GENERAL_Y_OFFSET,
      `osu! Report for: ${osuUsername}`
    );
  }

  async _drawDifferences() {
    const {
      difGlobalRank,
      difCountryRank,
      difAcc,
      difPP,
      difPlayCount
    } = this.delta;

    await this._drawCommands(
      this._printDifferenceColor,
      [527],
      [100, this.globalRank, difGlobalRank],
      [140, this.countryRank, difCountryRank],
      [180, this.accuracy, difAcc],
      [220, this.pp, difPP],
      [260, this.plays, difPlayCount]
    );
  }

  async _drawLevels() {
    //level bar
    const levelBar = (await resourceGetter.getImage("levelBar")).clone();

    const { difLevel } = this.delta;
    const fLevel = parseFloat(this.user.level);
    const fProgress = fLevel % 1;
    const percentage = Math.trunc(fProgress * 100).toString() + "%";
    const level = Math.trunc(fLevel).toString();

    if (fProgress > 0) {
      levelBar.resize(430 * fProgress, 6);
      this.image.composite(levelBar, 303, 309);
    }

    const hex = (await resourceGetter.getImage("hex")).clone();
    await this._printCentered(
      hex,
      "ubuntuBBlue24",
      hex.getWidth() / 2,
      hex.getHeight() / 2,
      level
    );

    const spacing = 5;
    const center = 312;
    return this._printCenteredY(
      "ubuntuBBlack24",
      734 + LEVEL_BAR_X_OFFSET,
      center,
      percentage
    )
      .then(({ x }) =>
        this._printCenteredY("ubuntuBGreen24", x + spacing, center, difLevel)
      )
      .then(({ x }) =>
        this.image.blit(hex, x + spacing, center - hex.getHeight() / 2)
      );
  }
}

class ReportGenerator {
  async generateReports(
    playObjects,
    player,
    user,
    sessionDuration,
    date,
    delta
  ) {
    const baseReport = await resourceGetter.getNewReportTemplate();
    let generator = new Report(
      baseReport.clone(),
      player,
      user,
      sessionDuration,
      date,
      delta
    );

    let reportWithHeader = await generator.generate();

    const playsPerImage = 10;
    const maxImages = 4;
    const plays = await Promise.all(
      playObjects
        .slice(0, maxImages * playsPerImage)
        .map(play => PlayImage.create(play))
    );
    const playSets = new Array(Math.ceil(plays.length / playsPerImage))
      .fill(null)
      .map((_, n) => plays.slice(n * playsPerImage, (n + 1) * playsPerImage));

    const heightOfGeneralInfo = 485;
    const padding = { x: 25, y: 20, between: 25 };

    const reports = playSets.map((plays, ridx) => {
      const report = ridx > 0 ? baseReport.clone() : reportWithHeader;
      plays.forEach((play, idx) => {
        report.composite(
          play,
          padding.x,
          (play.getHeight() + padding.between) * idx +
            heightOfGeneralInfo +
            padding.y
        );
      });
      report.crop(
        0,
        +(ridx > 0) * heightOfGeneralInfo,
        report.getWidth(),
        heightOfGeneralInfo +
          padding.y +
          (plays[0].getHeight() + padding.between) * plays.length +
          -5 +
          -(ridx > 0) * heightOfGeneralInfo
      );
      return report;
    });

    return reports;
  }
}

module.exports = new ReportGenerator();
