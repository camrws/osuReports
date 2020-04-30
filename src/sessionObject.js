var osuApi = require('./osuApi');
const axios = require('axios');
const cheerio = require('cheerio');
var ojsama = require("ojsama");
var request = require("request");
var playObjectv2 = require("./playObjectv2");
var jimp = require("jimp");
var globalInstances = require('./globalInstances');
var fs = require("fs");
var Twit = require('twit');
var sqlite3 = require('sqlite3');
var keys = require('./consumerKeys');

var db = new sqlite3.Database('osuReports_v2.db');

var T = new Twit({ consumer_key: keys.consumer_key, consumer_secret: keys.consumer_secret, access_token: keys.access_token, access_token_secret: keys.access_token_secret });

class sessionObject {
    constructor(osuUsername, twitterUsername, scoreOfRecentPlay, isDebug) {
        this.osuUsername = osuUsername;
        this.twitterUsername = twitterUsername;
        this.userObjectStartOfSession;
        this.userObjectEndOfSession;
        this.playObjects = [];
        this.sessionID;
        this.isDebug;


        //get the initial state of the user
        if (isDebug == false) {
            osuApi.getUser({ u: this.osuUsername }).then(user => {
                this.userObjectStartOfSession = user;
            }).catch(err => {
                globalInstances.logMessage(err);
            });

            if (scoreOfRecentPlay.id == undefined) {
                globalInstances.logMessage(this.osuUsername + " " + this.twitterUsername + " - Session object created via API");
                this.addNewPlayAPI(scoreOfRecentPlay);
            } else {
                globalInstances.logMessage(this.osuUsername + " " + this.twitterUsername + " - Session object created via WEB");
                this.addNewPlayWEB(scoreOfRecentPlay);
            }

        } else {
            this.isDebug = isDebug;
            globalInstances.logMessage("\ndebug mode init");
            osuApi.getUser({ u: this.osuUsername }).then(user => {
                this.userObjectStartOfSession = user;
                this.userObjectStartOfSession.pp.rank = parseFloat(this.userObjectStartOfSession.pp.rank) + 696;
                this.userObjectStartOfSession.pp.countryRank = parseFloat(this.userObjectStartOfSession.pp.countryRank) + 420;
                this.userObjectStartOfSession.accuracy = parseFloat(this.userObjectStartOfSession.accuracy) + 53;
                this.userObjectStartOfSession.pp.raw = parseFloat(this.userObjectStartOfSession.pp.raw) - 2.0092;
                this.userObjectStartOfSession.counts.plays = parseFloat(this.userObjectStartOfSession.counts.plays) - 2;
            }).catch(err => {
                globalInstances.logMessage(" - " + err)
            });


            this.addNewPlayWEB(scoreOfRecentPlay[0]);
            this.addNewPlayWEB(scoreOfRecentPlay[1]);
            this.addNewPlayWEB(scoreOfRecentPlay[2]);
            this.addNewPlayWEB(scoreOfRecentPlay[3]);
            this.addNewPlayWEB(scoreOfRecentPlay[4]);
            this.addNewPlayWEB(scoreOfRecentPlay[1]);
            this.addNewPlayWEB(scoreOfRecentPlay[2]);
            this.addNewPlayWEB(scoreOfRecentPlay[1]);
            this.addNewPlayWEB(scoreOfRecentPlay[2]);

            // var this_x = this;
            // setTimeout(function () {
            //     this_x.addNewPlayWEB(scoreOfRecentPlay[0]);
            //     this_x.addNewPlayWEB(scoreOfRecentPlay[1]);
            //     this_x.addNewPlayWEB(scoreOfRecentPlay[2]);
            //     this_x.addNewPlayWEB(scoreOfRecentPlay[3]);
            //     this_x.addNewPlayWEB(scoreOfRecentPlay[4]);
            //     this_x.addNewPlayWEB(scoreOfRecentPlay[0]);
            //     this_x.addNewPlayWEB(scoreOfRecentPlay[4]);
            //     this_x.addNewPlayWEB(scoreOfRecentPlay[0]);
            //     this_x.addNewPlayWEB(scoreOfRecentPlay[4]);

            //     var this_y = this_x;
            //     setTimeout(function () {
            //         this_y.addNewPlayWEB(scoreOfRecentPlay[0]);
            //         this_y.addNewPlayWEB(scoreOfRecentPlay[1]);
            //         this_y.addNewPlayWEB(scoreOfRecentPlay[2]);
            //         this_y.addNewPlayWEB(scoreOfRecentPlay[3]);
            //         this_y.addNewPlayWEB(scoreOfRecentPlay[4]);
            //         this_y.addNewPlayWEB(scoreOfRecentPlay[0]);
            //         this_y.addNewPlayWEB(scoreOfRecentPlay[4]);
            //         this_y.addNewPlayWEB(scoreOfRecentPlay[0]);
            //         this_y.addNewPlayWEB(scoreOfRecentPlay[4]);

            //         var this_c = this_y;
            //         setTimeout(function () {
            //             this_c.addNewPlayWEB(scoreOfRecentPlay[0]);
            //             this_c.addNewPlayWEB(scoreOfRecentPlay[1]);
            //             this_c.addNewPlayWEB(scoreOfRecentPlay[2]);
            //             this_c.addNewPlayWEB(scoreOfRecentPlay[3]);
            //             this_c.addNewPlayWEB(scoreOfRecentPlay[4]);
            //             this_c.addNewPlayWEB(scoreOfRecentPlay[0]);
            //             this_c.addNewPlayWEB(scoreOfRecentPlay[4]);
            //             this_c.addNewPlayWEB(scoreOfRecentPlay[0]);
            //             this_c.addNewPlayWEB(scoreOfRecentPlay[4]);
            //             var this_z = this_c;
            //             setTimeout(function () {
            //                 this_z.addNewPlayWEB(scoreOfRecentPlay[0]);
            //                 this_z.addNewPlayWEB(scoreOfRecentPlay[1]);
            //                 this_z.addNewPlayWEB(scoreOfRecentPlay[2]);
            //                 this_z.addNewPlayWEB(scoreOfRecentPlay[3]);
            //                 this_z.addNewPlayWEB(scoreOfRecentPlay[4]);
            //                 this_z.addNewPlayWEB(scoreOfRecentPlay[0]);
            //                 this_z.addNewPlayWEB(scoreOfRecentPlay[4]);
            //                 this_z.addNewPlayWEB(scoreOfRecentPlay[0]);
            //                 this_z.addNewPlayWEB(scoreOfRecentPlay[4]);

            //             }, 5000);
            //         }, 5000);
            //     }, 5000);
            // }, 5000);
        }
    }

    addNewPlayAPI(scoreOfRecentPlay) {
        this.playObjects.push(new playObjectv2("", "", "", "", "", scoreOfRecentPlay));
    }

    addNewPlayWEB(scoreOfRecentPlay) {
        var bpmurl = 'https://osu.ppy.sh/beatmapsets/' + scoreOfRecentPlay.beatmap.beatmapset_id + '#osu/' + scoreOfRecentPlay.beatmap.id;
        axios.get(bpmurl)
            .then(response => {
                var $ = cheerio.load(response.data);
                var html = $("#json-beatmapset").html();
                var data = JSON.parse(html);
                var bpm = data.bpm;
                var mods = "";
                if (scoreOfRecentPlay.mods.length > 0) {
                    mods = "+";
                    for (var i = 0; i < scoreOfRecentPlay.mods.length; i++) {
                        mods = mods + scoreOfRecentPlay.mods[i];
                    }
                }
                var acc_percent = scoreOfRecentPlay.accuracy * 100;
                var combo = scoreOfRecentPlay.max_combo;
                var nmiss = scoreOfRecentPlay.statistics.count_miss;
                if (mods.startsWith("+")) {
                    mods = ojsama.modbits.from_string(mods.slice(1) || "");
                }
                var parser = new ojsama.parser();
                var this_ = this;
                request("https://osu.ppy.sh/osu/" + scoreOfRecentPlay.beatmap.id, function (err, res, body) {
                    parser.feed(body);
                    var map = parser.map;
                    try {
                        var stars = new ojsama.diff().calc({ map: map, mods: mods });
                        var pp = ojsama.ppv2({
                            stars: stars,
                            combo: combo,
                            nmiss: nmiss,
                            acc_percent: acc_percent,
                        });
                        var max_combo = map.max_combo();
                        combo = combo || max_combo;
                        this_.playObjects.push(new playObjectv2(stars.toString().split(" ")[0], pp.toString().split(" ")[0], bpm, combo, max_combo, scoreOfRecentPlay));
                    } catch (error) {
                        globalInstances.logMessage("Err: Problem occured when going to add a play from the web - " + error + "\n");
                    }

                })
            })
            .catch(error => {
                globalInstances.logMessage(error);
            })
    }

    endSession() {
        globalInstances.logMessage("Attempting to end session for: " + this.osuUsername + "\n")
        //checks to see if there are real plays in session
        var isTweetable = false;
        for (var i = 0; i < this.playObjects.length; i++) {
            if (this.playObjects[i].background != undefined) {
                isTweetable = true;
                break;
            }
        }
        for (var i = 0; i < this.playObjects.length; i++) {
            if (this.playObjects[i].background != undefined) {
                if ((this.playObjects[i].background).substring((this.playObjects[i].background).indexOf("?") + 1) == "0") {
                    this.playObjects[i].background = "https://assets.ppy.sh/beatmaps/1084284/covers/cover.jpg?1581740491";
                    this.playObjects[i].artist = this.playObjects[i].artist + " <default bg>";
                }
            }
        }
        if (isTweetable == true && this.playObjects.length == 1) {
            isTweetable = false;
        }
        if (isTweetable == false) {
            var isTweetableResponse = this.osuUsername + " - This session has no plays with a background or only has one play";
            globalInstances.logMessage(error); (isTweetableResponse);
            return;
        }
        osuApi.getUser({ u: this.osuUsername }).then(user => {
            this.userObjectEndOfSession = user;
            var currentTime = new Date();
            currentTime.setHours(currentTime.getHours() - 6);
            var date = currentTime.getMonth() + 1 + "/" + currentTime.getDate() + "/" + currentTime.getFullYear();

            var sessionDurationSeconds = 0;
            if (this.isDebug) {
                sessionDurationSeconds = 1000;
            } else {
                sessionDurationSeconds = ((this.playObjects[this.playObjects.length - 1].date.getTime() - this.playObjects[0].date.getTime()) / 1000);
            }

            if (sessionDurationSeconds < globalInstances.minimalSessionLengthSeconds && sessionDurationSeconds >= 0 && this.isDebug == false) {
                var sessionDurationResponse = this.osuUsername + " - This session is not long enough: " + sessionDurationSeconds + "\n";
                globalInstances.logMessage(sessionDurationResponse);
                return;
            }

            var sessionDurationDays = Math.floor(sessionDurationSeconds / (3600 * 24));
            sessionDurationSeconds = sessionDurationSeconds - (sessionDurationDays * 3600 * 24);
            var sessionDurationHours = Math.floor(sessionDurationSeconds / (3600));
            sessionDurationSeconds = sessionDurationSeconds - (sessionDurationHours * 3600);
            var sessionDurationMinutes = Math.floor(sessionDurationSeconds / (60));
            sessionDurationSeconds = Math.floor(sessionDurationSeconds - (sessionDurationMinutes * 60));

            var sessionDuration = globalInstances.convertTimeToHMS(sessionDurationHours, sessionDurationMinutes, sessionDurationSeconds);

            var difGlobalRank = parseFloat(this.userObjectEndOfSession.pp.rank) - parseFloat(this.userObjectStartOfSession.pp.rank);
            if (difGlobalRank < 0 && difGlobalRank != "NaN") {
                var tempDifGlobalRank = difGlobalRank
                tempDifGlobalRank = tempDifGlobalRank.toString();
                tempDifGlobalRank = tempDifGlobalRank.substring(1, tempDifGlobalRank.length)
                tempDifGlobalRank = parseFloat(tempDifGlobalRank).toLocaleString('en')
                tempDifGlobalRank = tempDifGlobalRank.toString();
                difGlobalRank = "(+" + tempDifGlobalRank + ")"
            }
            else if (difGlobalRank > 0 && difGlobalRank != "NaN") {
                var tempDifGlobalRank = difGlobalRank
                tempDifGlobalRank = tempDifGlobalRank.toString();
                tempDifGlobalRank = parseFloat(tempDifGlobalRank).toLocaleString('en')
                tempDifGlobalRank = tempDifGlobalRank.toString();
                difGlobalRank = "(-" + tempDifGlobalRank + ")"
            }
            else { difGlobalRank = "" }

            var difCountryRank = parseFloat(this.userObjectEndOfSession.pp.countryRank) - parseFloat(this.userObjectStartOfSession.pp.countryRank)
            if (difCountryRank < 0 && difGlobalRank != "NaN") {
                var tempDifCountryRank = difCountryRank
                tempDifCountryRank = tempDifCountryRank.toString();
                tempDifCountryRank = tempDifCountryRank.substring(1, tempDifCountryRank.length)
                tempDifCountryRank = parseFloat(tempDifCountryRank).toLocaleString('en')
                tempDifCountryRank = tempDifCountryRank.toString();
                difCountryRank = "(+" + tempDifCountryRank + ")"
            }
            else if (difCountryRank > 0 && difGlobalRank != "NaN") {
                var tempDifCountryRank = difCountryRank
                tempDifCountryRank = tempDifCountryRank.toString();
                tempDifCountryRank = parseFloat(tempDifCountryRank).toLocaleString('en')
                tempDifCountryRank = tempDifCountryRank.toString();
                difCountryRank = "(-" + tempDifCountryRank + ")"
            }
            else { difCountryRank = "" }

            var difLevel = parseFloat(this.userObjectEndOfSession.level) - parseFloat(this.userObjectStartOfSession.level);

            if (difLevel > 0) { difLevel = "(+" + (difLevel * 100).toFixed(0) + "%)" } else if (difLevel < 0) { difLevel = "(" + (difLevel * 100).toFixed(0) + "%)" } else { difLevel = "" }

            if (difLevel == "(+0%)") { difLevel = "" }

            var difRankedScore = parseFloat(this.userObjectEndOfSession.scores.ranked) - parseFloat(this.userObjectStartOfSession.scores.ranked)
            if (difRankedScore > 0) { difRankedScore = "(+" + parseFloat(difRankedScore).toLocaleString('en') + ")" } else if (difRankedScore < 0) { difRankedScore = "(" + parseFloat(difRankedScore).toLocaleString('en') + ")" } else { difRankedScore = "" }
            var difAcc = parseFloat(this.userObjectEndOfSession.accuracy) - parseFloat(this.userObjectStartOfSession.accuracy)
            if (difAcc > 0 && parseFloat(difAcc).toFixed(2) != 0.00) { difAcc = "(+" + parseFloat(difAcc).toFixed(2) + "%)" }
            else if (difAcc < 0 && parseFloat(difAcc).toFixed(2) != 0.00) { difAcc = "(" + parseFloat(difAcc).toFixed(2) + "%)" }
            else { difAcc = "" }
            var difPP = parseFloat(this.userObjectEndOfSession.pp.raw) - parseFloat(this.userObjectStartOfSession.pp.raw)

            if (difPP > 0) { difPP = "(+" + difPP.toFixed(2) + ")" }
            else if (difPP < 0) { difPP = "(" + difPP.toFixed(2) + ")" }
            else { difPP = "" }

            var difPlayCount = parseFloat(this.userObjectEndOfSession.counts.plays) - parseFloat(this.userObjectStartOfSession.counts.plays)
            if (difPlayCount > 0) { difPlayCount = "(+" + parseFloat(difPlayCount).toLocaleString('en') + ")" } else if (difPlayCount < 0) { difPlayCount = "(" + parseFloat(difPlayCount).toLocaleString('en') + ")" } else { difPlayCount = "" }




            var images = [
                './static/images/rawReports/report1.png',
                './static/images/rawReports/report2.png',
                './static/images/rawReports/report3.png',
                './static/images/rawReports/report4.png',
                'https://a.ppy.sh/' + this.userObjectStartOfSession.id,
                "./static/images/flags/" + this.userObjectStartOfSession.country + ".png",
                "./static/masks/circleMask.png",
                "./static/images/ranks/SSPlus.png",
                "./static/images/ranks/SS.png",
                "./static/images/ranks/SPlus.png",
                "./static/images/ranks/S.png",
                "./static/images/ranks/A.png",
                "./static/images/ranks/B.png",
                "./static/images/ranks/C.png",
                "./static/images/osuReportsLogo.png",
                "./static/images/levelBar.png",
                "./static/images/hex.png",
                "./static/masks/playImageMask.png",
                "./static/masks/playShadowMask.png",
                "./static/images/stars/onlinestar.png",
                "./static/images/stars/onlinestar.png",
                "./static/images/stars/onlinestar.png",
                "./static/images/stars/onlinestar.png",
                "./static/images/mods/mod_flashlight.png",
                "./static/images/mods/mod_hard-rock.png",
                "./static/images/mods/mod_hidden.png",
                "./static/images/mods/mod_nightcore.png",
                "./static/images/mods/mod_perfect.png",
                "./static/images/mods/mod_sudden-death.png",
                "./static/images/mods/mod_double-time.png",
                "./static/images/ranks/D.png",
                "./static/images/mods/mod_no-fail.png",
                "./static/images/mods/mod_easy.png"];

            var indexOfPlayImages = images.length;

            for (var i = 0; i < this.playObjects.length; i++) {
                if (this.playObjects[i].background == undefined) {
                    this.playObjects.splice(i, 1);
                    i--;
                }
            }
            var axiosMaps = [];
            for (var i = 0; i < this.playObjects.length; i++) {
                axiosMaps.push(axios.get(this.playObjects[i].background)
                    .then(response => {
                        return 1;
                    }).catch(error => {
                        return 0;
                    }));
            }
            var tempThis = this;

            Promise.all(axiosMaps).then(function (res) {
                for (var i = 0; i < res.length; i++) {
                    if (res[i] == 0) {
                        tempThis.playObjects[i].background = 'https://assets.ppy.sh/beatmaps/1084284/covers/cover.jpg?1581740491';
                        tempThis.playObjects[i].artist = tempThis.playObjects[i].artist + " <default bg, null>";
                    }
                }

                //db stuff
                tempThis.sessionID = globalInstances.numberOfSessionsRecorded + 1;
                globalInstances.numberOfSessionsRecorded = globalInstances.numberOfSessionsRecorded + 1

                var sqlSessionData = "INSERT INTO sessionsTable VALUES ('" + tempThis.sessionID + "', 'NULL', '" + date + "', '" + tempThis.osuUsername + "', '" + sessionDuration + "', '" + tempThis.userObjectEndOfSession.pp.rank + "', '" + difGlobalRank + "'," +
                    "'" + tempThis.userObjectEndOfSession.pp.countryRank + "', '" + difCountryRank + "', '" + tempThis.userObjectEndOfSession.level + "', '" + difLevel + "', " +
                    "'" + parseFloat(tempThis.userObjectEndOfSession.accuracy).toFixed(2) + "', '" + difAcc + "', '" + parseFloat(tempThis.userObjectEndOfSession.pp.raw) + "', '" + difPP + "', '" + parseFloat(tempThis.userObjectEndOfSession.counts.plays) + "', '" + difPlayCount + "'," +
                    "'" + tempThis.userObjectEndOfSession.counts.SSH + "', '" + tempThis.userObjectEndOfSession.counts.SS + "', '" + tempThis.userObjectEndOfSession.counts.SH + "', '" + tempThis.userObjectEndOfSession.counts.S + "', '" + tempThis.userObjectEndOfSession.counts.A + "')";


                globalInstances.logMessage(tempThis.osuUsername + " - " + sqlSessionData + "\n");

                db.serialize(() => {
                    db.run(sqlSessionData);
                });

                for (var i = 0; i < tempThis.playObjects.length; i++) {
                    var sqlTitle = tempThis.playObjects[i].title;
                    var sqlVersion = tempThis.playObjects[i].version;
                    var sqlArtist = tempThis.playObjects[i].artist;

                    if (sqlTitle.includes("'")) {
                        sqlTitle = sqlTitle.replace(/'/g, "''")
                    }
                    if (sqlVersion.includes("'")) {
                        sqlVersion = sqlVersion.replace(/'/g, "''")
                    }
                    if (sqlArtist.includes("'")) {
                        sqlArtist = sqlArtist.replace(/'/g, "''")
                    }

                    if (sqlTitle.includes("\"")) {
                        sqlTitle = sqlTitle.replace(/"/g, "\"\"")
                    }
                    if (sqlVersion.includes("\"")) {
                        sqlVersion = sqlVersion.replace(/"/g, "\"\"")
                    }
                    if (sqlArtist.includes("\"")) {
                        sqlArtist = sqlArtist.replace(/"/g, "\"\"")
                    }

                    var songDurationTotalSeconds = parseInt(tempThis.playObjects[i].duration);
                    var songDurationSeconds = songDurationTotalSeconds % 60;
                    var songDurationMinutes = Math.floor(songDurationTotalSeconds / 60) % 60;
                    var songDurationHours = Math.floor(songDurationTotalSeconds / 3600);
                    var songDuration = globalInstances.convertTimeToHMS(songDurationHours, songDurationMinutes, songDurationSeconds)

                    var sqlMods = "";
                    for (var j = 0; j < tempThis.playObjects[i].mods.length; j++) {
                        sqlMods += tempThis.playObjects[i].mods[j] + ", ";
                    }
                    sqlMods = sqlMods.substring(0, sqlMods.length - 2);

                    var sqlPlayData = "INSERT INTO playsTable VALUES ('" + tempThis.sessionID + "', '" + tempThis.playObjects[i].background + "', '" + sqlTitle + "', '" + sqlVersion + "', '" + sqlArtist + "', '" + tempThis.playObjects[i].combo + " / " + tempThis.playObjects[i].maxCombo + "', '" + tempThis.playObjects[i].bpm + "'," +
                        "'" + songDuration + "', '" + tempThis.playObjects[i].stars + "', '" + tempThis.playObjects[i].accuracy + "', '" + tempThis.playObjects[i].rank + "', '" + sqlMods + "', '" + tempThis.playObjects[i].countsObject.count_300 + "', '" + tempThis.playObjects[i].countsObject.count_100 + "', '" + tempThis.playObjects[i].countsObject.count_50 + "', '" + tempThis.playObjects[i].countsObject.count_miss + "', '" + tempThis.playObjects[i].pp + "')";


                    globalInstances.logMessage(tempThis.osuUsername + " - " + sqlPlayData)


                    db.serialize(() => {
                        db.run(sqlPlayData);
                    });
                }
                //db stuff end

                for (var i = 0; i < tempThis.playObjects.length; i++) {
                    images.push(tempThis.playObjects[i].background);
                }
                var jimps = [];
                for (var f = 0; f < images.length; f++) {
                    jimps.push(jimp.read(images[f]));
                }

                var this_ = tempThis;

                Promise.all(jimps).then(function (data) {
                    return Promise.all(jimps);
                }).then(function (data) {
                    data[4].resize(256, 256);
                    data[7].resize(120, 63.6); //SSPlus
                    data[8].resize(120, 63.6); //SS
                    data[9].resize(120, 63.6); //SPlus
                    data[10].resize(120, 63.6); //S
                    data[11].resize(109.2, 63.6); //A
                    data[12].resize(95.16, 63.6); //B
                    data[13].resize(95.16, 63.6); //C
                    data[30].resize(95.16, 63.6); //D
                    data[19].resize(35, 35); //star
                    data[20].resize(28, 28); //star
                    data[21].resize(20, 20); //star
                    data[22].resize(15, 15); //star
                    data[14].resize(100, 100);
                    data[0].composite(data[14], 840, 10)

                    var rankXOffset = 55;
                    var rankYOffset = 40;

                    data[0].composite(data[7], 220 + rankXOffset, 305 + rankYOffset)
                    data[0].composite(data[8], 340 + rankXOffset, 305 + rankYOffset)
                    data[0].composite(data[9], 460 + rankXOffset, 305 + rankYOffset)
                    data[0].composite(data[10], 580 + rankXOffset, 305 + rankYOffset)
                    data[0].composite(data[11], 700 + rankXOffset, 305 + rankYOffset)



                    data[4].mask(data[6], 0, 0);

                    data[0].composite(data[4], 25, 25)

                    data[0].composite(data[4], 25, 25)

                    data[0].composite(data[5], 83, 308) // flag

                    var xCoord = 53;
                    var yCoord = -10;

                    var doesFirstImageExist = false;
                    var doesSecondImageExist = false;
                    var doesThirdImageExist = false;
                    var doesFourthImageExist = false;

                    var fontsPromises = [];
                    fontsPromises.push(jimp.loadFont("./static/fonts/ubuntuB_blue_32.fnt"));
                    fontsPromises.push(jimp.loadFont("./static/fonts/ubuntuB_black_32.fnt"));
                    fontsPromises.push(jimp.loadFont("./static/fonts/ubuntuB_red_32.fnt"));
                    fontsPromises.push(jimp.loadFont("./static/fonts/ubuntuB_green_32.fnt"));
                    fontsPromises.push(jimp.loadFont("./static/fonts/ubuntuB_black_24.fnt"));
                    fontsPromises.push(jimp.loadFont("./static/fonts/ubuntuB_green_24.fnt"));
                    fontsPromises.push(jimp.loadFont("./static/fonts/ubuntuB_blue_24.fnt"));
                    fontsPromises.push(jimp.loadFont("./static/fonts/ubuntuB_lightblue_32.fnt"));
                    fontsPromises.push(jimp.loadFont("./static/fonts/ubuntuB_white_24.fnt"));
                    fontsPromises.push(jimp.loadFont("./static/fonts/ubuntuB_white_32.fnt"));
                    fontsPromises.push(jimp.loadFont("./static/fonts/ubuntuB_gold_52.fnt"));
                    fontsPromises.push(jimp.loadFont("./static/fonts/ubuntuB_yellow_32.fnt"));
                    fontsPromises.push(jimp.loadFont("./static/fonts/ubuntuB_lightgreen_32.fnt"));
                    fontsPromises.push(jimp.loadFont("./static/fonts/ubuntuB_lightred_32.fnt"));


                    Promise.all(fontsPromises).then(function (res) {

                        var ubuntuB_blue_32 = res[0];
                        var ubuntuB_black_32 = res[1];
                        var ubuntuB_red_32 = res[2];
                        var ubuntuB_green_32 = res[3];
                        var ubuntuB_black_24 = res[4];
                        var ubuntuB_green_24 = res[5];
                        var ubuntuB_blue_24 = res[6];
                        var ubuntuB_lightblue_32 = res[7];
                        var ubuntuB_white_24 = res[8];
                        var ubuntuB_white_32 = res[9];
                        var ubuntuB_gold_52 = res[10];
                        var ubuntuB_yellow_32 = res[11];
                        var ubuntuB_lightgreen_32 = res[12];
                        var ubuntuB_lightred_32 = res[13];


                        data[0].print(ubuntuB_black_32, 25, 450, "Session Duration: " + sessionDuration);
                        data[0].print(ubuntuB_black_32, 502, 450, "Date of Session: " + date);


                        data[0].print(ubuntuB_blue_32, 326 + xCoord, 100 + yCoord, "Global Rank:");
                        data[0].print(ubuntuB_blue_32, 300 + xCoord, 140 + yCoord, "Country Rank:");
                        data[0].print(ubuntuB_blue_32, 371 + xCoord, 180 + yCoord, "Accuracy:");
                        data[0].print(ubuntuB_blue_32, 466 + xCoord, 220 + yCoord, "PP:");
                        data[0].print(ubuntuB_blue_32, 341 + xCoord, 260 + yCoord, "Play Count:");

                        data[0].print(ubuntuB_black_32, (-(jimp.measureText(ubuntuB_black_32, this_.osuUsername)) / 2) + 440, 28 + yCoord, "osu! Report for: " + this_.osuUsername);

                        data[0].print(ubuntuB_black_32, 522 + xCoord, 100 + yCoord, "#" + parseFloat(this_.userObjectEndOfSession.pp.rank).toLocaleString('en'));
                        data[0].print(ubuntuB_black_32, 522 + xCoord, 140 + yCoord, "#" + parseFloat(this_.userObjectEndOfSession.pp.countryRank).toLocaleString('en'));
                        data[0].print(ubuntuB_black_32, 522 + xCoord, 180 + yCoord, parseFloat(this_.userObjectEndOfSession.accuracy).toFixed(2) + "%");
                        data[0].print(ubuntuB_black_32, 522 + xCoord, 220 + yCoord, parseFloat(this_.userObjectEndOfSession.pp.raw).toLocaleString('en'));
                        data[0].print(ubuntuB_black_32, 522 + xCoord, 260 + yCoord, parseFloat(this_.userObjectEndOfSession.counts.plays).toLocaleString('en').toString());

                        if (difGlobalRank.includes("+")) {
                            data[0].print(ubuntuB_green_32, 522 + xCoord + jimp.measureText(ubuntuB_black_32, "#" + parseFloat(this_.userObjectEndOfSession.pp.rank).toLocaleString('en').toString()) + 5, 100 + yCoord, difGlobalRank);
                        } else if (difGlobalRank.includes("-")) {
                            data[0].print(ubuntuB_red_32, 522 + xCoord + jimp.measureText(ubuntuB_black_32, "#" + parseFloat(this_.userObjectEndOfSession.pp.rank).toLocaleString('en').toString()) + 5, 100 + yCoord, difGlobalRank);
                        }

                        if (difCountryRank.includes("+")) {
                            data[0].print(ubuntuB_green_32, 522 + xCoord + jimp.measureText(ubuntuB_black_32, "#" + parseFloat(this_.userObjectEndOfSession.pp.countryRank).toLocaleString('en').toString()) + 5, 140 + yCoord, difCountryRank);
                        } else if (difCountryRank.includes("-")) {
                            data[0].print(ubuntuB_red_32, 522 + xCoord + jimp.measureText(ubuntuB_black_32, "#" + parseFloat(this_.userObjectEndOfSession.pp.countryRank).toLocaleString('en').toString()) + 5, 140 + yCoord, difCountryRank);
                        }

                        if (difAcc.includes("+")) {
                            data[0].print(ubuntuB_green_32, 522 + xCoord + jimp.measureText(ubuntuB_black_32, parseFloat(this_.userObjectEndOfSession.accuracy).toFixed(2) + "%") + 5, 180 + yCoord, difAcc);
                        } else if (difAcc.includes("-")) {
                            data[0].print(ubuntuB_red_32, 522 + xCoord + jimp.measureText(ubuntuB_black_32, parseFloat(this_.userObjectEndOfSession.accuracy).toFixed(2) + "%") + 5, 180 + yCoord, difAcc);
                        }

                        if (difPP.includes("+")) {
                            data[0].print(ubuntuB_green_32, 522 + xCoord + jimp.measureText(ubuntuB_black_32, parseFloat(this_.userObjectEndOfSession.pp.raw).toLocaleString('en').toString()) + 5, 220 + yCoord, difPP);
                        } else if (difPP.includes("-")) {
                            data[0].print(ubuntuB_red_32, 522 + xCoord + jimp.measureText(ubuntuB_black_32, parseFloat(this_.userObjectEndOfSession.pp.raw).toLocaleString('en').toString()) + 5, 220 + yCoord, difPP);
                        }

                        if (difPlayCount.includes("+")) {
                            data[0].print(ubuntuB_green_32, 522 + xCoord + jimp.measureText(ubuntuB_black_32, parseFloat(this_.userObjectEndOfSession.counts.plays).toLocaleString('en').toString()) + 5, 260 + yCoord, difPlayCount);
                        } else if (difPlayCount.includes("-")) {
                            data[0].print(ubuntuB_red_32, 522 + xCoord + jimp.measureText(ubuntuB_black_32, parseFloat(this_.userObjectEndOfSession.counts.plays).toLocaleString('en').toString()) + 5, 260 + yCoord, difPlayCount);
                        }


                        //counts
                        data[0].print(ubuntuB_black_24, 280 + rankXOffset - jimp.measureText(ubuntuB_black_24, this_.userObjectEndOfSession.counts.SSH) * 0.7, 365 + rankYOffset, this_.userObjectEndOfSession.counts.SSH);
                        data[0].print(ubuntuB_black_24, 400 + rankXOffset - jimp.measureText(ubuntuB_black_24, this_.userObjectEndOfSession.counts.SS) * 0.7, 365 + rankYOffset, this_.userObjectEndOfSession.counts.SS);
                        data[0].print(ubuntuB_black_24, 520 + rankXOffset - jimp.measureText(ubuntuB_black_24, this_.userObjectEndOfSession.counts.SH) * 0.7, 365 + rankYOffset, this_.userObjectEndOfSession.counts.SH);
                        data[0].print(ubuntuB_black_24, 640 + rankXOffset - jimp.measureText(ubuntuB_black_24, this_.userObjectEndOfSession.counts.S) * 0.7, 365 + rankYOffset, this_.userObjectEndOfSession.counts.S);
                        data[0].print(ubuntuB_black_24, 760 + rankXOffset - jimp.measureText(ubuntuB_black_24, this_.userObjectEndOfSession.counts.A) * 0.7, 365 + rankYOffset, this_.userObjectEndOfSession.counts.A);

                        //level bar
                        var levelBarXCoord = 0;
                        var levelBarYCoord = 5;
                        data[15].resize(430 * (this_.userObjectEndOfSession.level % 1).toFixed(2), 6);
                        data[0].composite(data[15], 303, 309)

                        //percent
                        data[0].print(ubuntuB_black_24, 734 + levelBarXCoord, 292 + levelBarYCoord, Math.trunc((this_.userObjectEndOfSession.level % 1) * 100).toString() + "%");

                        //dif percent
                        data[0].print(ubuntuB_green_24, 734 + levelBarXCoord + jimp.measureText(ubuntuB_green_24, Math.trunc((this_.userObjectEndOfSession.level % 1) * 100).toString() + "%") + 5, 292 + levelBarYCoord, difLevel);

                        //hex
                        data[0].composite(data[16], 734 + levelBarXCoord + jimp.measureText(ubuntuB_green_24, Math.trunc((this_.userObjectEndOfSession.level % 1) * 100).toString() + "%") + 5 + jimp.measureText(ubuntuB_green_24, difLevel) + 5, 275 + levelBarYCoord)

                        //level
                        data[0].print(ubuntuB_blue_24, 734 + (((-(jimp.measureText(ubuntuB_green_24, Math.trunc(parseFloat(this_.userObjectEndOfSession.level)).toString()))) / 1.76) + 15.9) + levelBarXCoord + jimp.measureText(ubuntuB_green_24, Math.trunc((this_.userObjectEndOfSession.level % 1) * 100).toString() + "%") + 5 + jimp.measureText(ubuntuB_green_24, difLevel) + 20, 292 + levelBarYCoord, Math.trunc(parseFloat(this_.userObjectEndOfSession.level)));

                        //plays
                        for (var i = 0; i < this_.playObjects.length; i++) {
                            var yMultiOffset;
                            var imageToEdit;
                            //console.log("current: " + i);

                            if (i < 10) {

                                if (!doesFirstImageExist) {
                                    globalInstances.logMessage("writing to 1")
                                    doesFirstImageExist = true;
                                    yMultiOffset = 0;
                                    imageToEdit = data[0];
                                }

                            } else if (i < 20) {

                                if (!doesSecondImageExist) {
                                    imageToEdit = data[1];
                                    globalInstances.logMessage("writing to 2")
                                    doesSecondImageExist = true;
                                    yMultiOffset = -2750;
                                }

                            } else if (i < 30) {

                                if (!doesThirdImageExist) {
                                    imageToEdit = data[2];
                                    globalInstances.logMessage("writing to 3")
                                    doesThirdImageExist = true;
                                    yMultiOffset = -2750 * 2;
                                }

                            } else if (i < 40) {
                                if (!doesFourthImageExist) {
                                    imageToEdit = data[3];
                                    globalInstances.logMessage("writing to 4")
                                    doesFourthImageExist = true;
                                    yMultiOffset = -2750 * 3;
                                }
                            } else {
                                globalInstances.logMessage("break;");
                                break;
                            }
                            //console.log(data.length);
                            //console.log(indexOfPlayImages + i);
                            data[indexOfPlayImages + i].mask(data[17], 0, 0)
                            imageToEdit.composite(data[indexOfPlayImages + i].brightness(-0.5), 25, 505 + (i * 275) + yMultiOffset)

                            // this_.playObjects[i].title = "Miniministop Hitoyasumi no Uta[Mokuyoubi]Gakusei no Uta"
                            // this_.playObjects[i].version = "xxxx xxx xx x "
                            // this_.playObjects[i].artist = "xxxx xxx xx x  xxxxx xxx xx xxxxx xx xxxxxx xxxxx xxx x xxx x xxxxx x xxxx"

                            globalInstances.logMessage("| working on titles ");

                            var tempTitle = this_.playObjects[i].title;
                            var tempVersion = this_.playObjects[i].version;
                            if (tempVersion.length > 20) {
                                tempVersion = tempVersion.substring(0, 20) + "..."
                            }
                            //jimp.measureText(ubuntuB_lightblue_32, this_.playObjects[i].title)
                            //1320
                            while (jimp.measureText(ubuntuB_lightblue_32, tempTitle + " [" + tempVersion + "]") > 1000) {
                                tempTitle = tempTitle.substring(0, tempTitle.length - 1)
                            }
                            if (tempTitle != this_.playObjects[i].title) {
                                tempTitle = tempTitle + "...";
                            }
                            imageToEdit.print(
                                ubuntuB_lightblue_32,
                                30,
                                505 + (i * 275) + yMultiOffset,
                                "" + tempTitle + " [" + tempVersion + "]",
                                680,
                                (err, image, { x, y }) => {
                                    var tempArtist = this_.playObjects[i].artist;
                                    while (jimp.measureText(ubuntuB_white_24, tempArtist) > 600) {
                                        tempArtist = tempArtist.substring(0, tempArtist.length - 1)
                                    }
                                    if (tempArtist == this_.playObjects[i].artist) {
                                        image.print(ubuntuB_white_24, 30, y, "  by " + this_.playObjects[i].artist, 1000);
                                    } else {
                                        image.print(ubuntuB_white_24, 30, y, "  by " + tempArtist + "...", 1000);
                                    }
                                }
                            );

                            globalInstances.logMessage("| working on rank ");
                            //rank
                            var playRankX = 800;
                            var playRankY = 50;

                            if (this_.playObjects[i].rank == "XH") {
                                imageToEdit.composite(data[7], playRankX, 505 + (i * 275) + yMultiOffset + playRankY);
                            } else if (this_.playObjects[i].rank == "X") {
                                imageToEdit.composite(data[8], playRankX, 505 + (i * 275) + yMultiOffset + playRankY);
                            } else if (this_.playObjects[i].rank == "SH") {
                                imageToEdit.composite(data[9], playRankX, 505 + (i * 275) + yMultiOffset + playRankY);
                            } else if (this_.playObjects[i].rank == "S") {
                                imageToEdit.composite(data[10], playRankX, 505 + (i * 275) + yMultiOffset + playRankY);
                            } else if (this_.playObjects[i].rank == "A") {
                                imageToEdit.composite(data[11], playRankX + 10, 505 + (i * 275) + yMultiOffset + playRankY);
                            } else if (this_.playObjects[i].rank == "B") {
                                imageToEdit.composite(data[12], playRankX + 20, 505 + (i * 275) + yMultiOffset + playRankY);
                            } else if (this_.playObjects[i].rank == "C") {
                                imageToEdit.composite(data[13], playRankX + 20, 505 + (i * 275) + yMultiOffset + playRankY);
                            } else if (this_.playObjects[i].rank == "D") {
                                imageToEdit.composite(data[30], playRankX + 20, 505 + (i * 275) + yMultiOffset + playRankY);
                            }

                            if (this_.playObjects[i].accuracy == "100.00") {
                                imageToEdit.print(ubuntuB_gold_52, 583 + 120, 505 + (i * 275) + yMultiOffset - 7, this_.playObjects[i].accuracy + "%");
                            } else {
                                imageToEdit.print(ubuntuB_gold_52, 610 + 120, 505 + (i * 275) + yMultiOffset - 7, this_.playObjects[i].accuracy + "%");
                            }

                            globalInstances.logMessage("| working on difficulty ")
                            //difficulty
                            var playStarY = 210;
                            var playStarX = 195;
                            var countOfStars = Math.ceil(parseFloat(this_.playObjects[i].stars)) - 1;
                            var partialStar = ((parseFloat(this_.playObjects[i].stars)) % 1).toFixed(2);
                            if (partialStar == 0.00) {
                                countOfStars += 1;
                            }
                            var posOfPartialStar;
                            for (var j = 1; j <= countOfStars; j++) {
                                posOfPartialStar = playStarX + (j - 1) * 40;
                                imageToEdit.composite(data[19], playStarX + (j - 1) * 40, 505 + (i * 275) + yMultiOffset + playStarY);
                            }
                            if (partialStar == 0.0) {
                                posOfPartialStar = posOfPartialStar - 40;
                            } else if (partialStar < 0.3) {
                                imageToEdit.composite(data[22], playStarX + posOfPartialStar - 144, 505 + (i * 275) + yMultiOffset + playStarY + 10);
                            } else if (partialStar < 0.6) {
                                imageToEdit.composite(data[21], playStarX + posOfPartialStar - 146, 505 + (i * 275) + yMultiOffset + playStarY + 7);
                            } else if (partialStar < 1) {
                                imageToEdit.composite(data[20], playStarX + posOfPartialStar - 152, 505 + (i * 275) + yMultiOffset + playStarY + 4);
                            }
                            imageToEdit.print(ubuntuB_lightblue_32, 30, 505 + (i * 275) + yMultiOffset + playStarY, "Difficulty: ");
                            imageToEdit.print(ubuntuB_white_32, 180 + posOfPartialStar - 100, 505 + (i * 275) + yMultiOffset + playStarY, "(" + this_.playObjects[i].stars + ")");

                            globalInstances.logMessage("| working on duration ")
                            //duration:
                            var songDurationTotalSeconds = parseInt(this_.playObjects[i].duration);
                            var songDurationSeconds = songDurationTotalSeconds % 60;
                            var songDurationMinutes = Math.floor(songDurationTotalSeconds / 60) % 60;
                            var songDurationHours = Math.floor(songDurationTotalSeconds / 3600);
                            var songDuration = globalInstances.convertTimeToHMS(songDurationHours, songDurationMinutes, songDurationSeconds);
                            var durationX = 41;
                            var durationY = 175;
                            imageToEdit.print(ubuntuB_lightblue_32, durationX, 505 + (i * 275) + yMultiOffset + durationY, "Duration: ");
                            imageToEdit.print(ubuntuB_white_32, durationX + 150, 505 + (i * 275) + yMultiOffset + durationY, songDuration);

                            globalInstances.logMessage("| working on bpm ")

                            //bpm
                            var bpmX = 75;
                            var bpmY = 140;
                            imageToEdit.print(ubuntuB_lightblue_32, 30 + bpmX, 505 + (i * 275) + yMultiOffset + bpmY, "BPM: ");
                            imageToEdit.print(ubuntuB_white_32, 190, 505 + (i * 275) + yMultiOffset + bpmY, this_.playObjects[i].bpm);

                            globalInstances.logMessage("| working on pp ")
                            //pp
                            imageToEdit.print(ubuntuB_gold_52, 800 - jimp.measureText(ubuntuB_gold_52, Math.ceil(this_.playObjects[i].pp) + "pp") + 107, 505 + (i * 275) + yMultiOffset + 185, Math.ceil(this_.playObjects[i].pp) + "pp");

                            globalInstances.logMessage("| working on mods ")

                            //mods
                            var modY = 120
                            var posOfMod = 870;
                            if (this_.playObjects[i].mods.includes('DT')) {
                                imageToEdit.composite(data[29], posOfMod, 505 + (i * 275) + yMultiOffset + modY);
                                posOfMod = posOfMod - 47;
                            }
                            if (this_.playObjects[i].mods.includes('NC')) {
                                imageToEdit.composite(data[26], posOfMod, 505 + (i * 275) + yMultiOffset + modY);
                                posOfMod = posOfMod - 47;
                            }
                            if (this_.playObjects[i].mods.includes('PF')) {
                                imageToEdit.composite(data[27], posOfMod, 505 + (i * 275) + yMultiOffset + modY);
                                posOfMod = posOfMod - 47;
                            }
                            if (this_.playObjects[i].mods.includes('HD')) {
                                imageToEdit.composite(data[25], posOfMod, 505 + (i * 275) + yMultiOffset + modY);
                                posOfMod = posOfMod - 47;
                            }
                            if (this_.playObjects[i].mods.includes('SD')) {
                                imageToEdit.composite(data[28], posOfMod, 505 + (i * 275) + yMultiOffset + modY);
                                posOfMod = posOfMod - 47;
                            }
                            if (this_.playObjects[i].mods.includes('FL')) {
                                imageToEdit.composite(data[23], posOfMod, 505 + (i * 275) + yMultiOffset + modY);
                                posOfMod = posOfMod - 47;
                            }
                            if (this_.playObjects[i].mods.includes('HR')) {
                                imageToEdit.composite(data[24], posOfMod, 505 + (i * 275) + yMultiOffset + modY);
                                posOfMod = posOfMod - 47;
                            }
                            if (this_.playObjects[i].mods.includes('NF')) {
                                imageToEdit.composite(data[31], posOfMod, 505 + (i * 275) + yMultiOffset + modY);
                                posOfMod = posOfMod - 47;
                            }
                            if (this_.playObjects[i].mods.includes('EZ')) {
                                imageToEdit.composite(data[32], posOfMod, 505 + (i * 275) + yMultiOffset + modY);
                                posOfMod = posOfMod - 47;
                            }

                            globalInstances.logMessage("| working on combo ")

                            //play combo
                            imageToEdit.print(ubuntuB_lightblue_32, 72, 505 + (i * 275) + yMultiOffset + 105, "Combo: ");
                            imageToEdit.print(ubuntuB_white_32, 190, 505 + (i * 275) + yMultiOffset + 105, this_.playObjects[i].combo + " / " + this_.playObjects[i].maxCombo);

                            globalInstances.logMessage("| working on counts ")

                            //play counts
                            var countY = 155;

                            var measurement = jimp.measureText(ubuntuB_lightblue_32, this_.playObjects[i].countsObject.count_300 + " / " + this_.playObjects[i].countsObject.count_100 + " / " + this_.playObjects[i].countsObject.count_50 + " / " + this_.playObjects[i].countsObject.count_miss);
                            imageToEdit.print(ubuntuB_lightblue_32, 915 - measurement, 505 + (i * 275) + yMultiOffset + countY, this_.playObjects[i].countsObject.count_300);
                            imageToEdit.print(ubuntuB_white_32, 915 - measurement + jimp.measureText(ubuntuB_lightblue_32, this_.playObjects[i].countsObject.count_300 + ""), 505 + (i * 275) + yMultiOffset + countY, " / ");
                            imageToEdit.print(ubuntuB_lightgreen_32, 915 - measurement + jimp.measureText(ubuntuB_lightblue_32, this_.playObjects[i].countsObject.count_300 + " / "), 505 + (i * 275) + yMultiOffset + countY, this_.playObjects[i].countsObject.count_100);
                            imageToEdit.print(ubuntuB_white_32, 915 - measurement + jimp.measureText(ubuntuB_lightblue_32, this_.playObjects[i].countsObject.count_300 + " / " + this_.playObjects[i].countsObject.count_100), 505 + (i * 275) + yMultiOffset + countY, " / ");
                            imageToEdit.print(ubuntuB_yellow_32, 915 - measurement + jimp.measureText(ubuntuB_lightblue_32, this_.playObjects[i].countsObject.count_300 + " / " + this_.playObjects[i].countsObject.count_100 + " / "), 505 + (i * 275) + yMultiOffset + countY, this_.playObjects[i].countsObject.count_50);
                            imageToEdit.print(ubuntuB_white_32, 915 - measurement + jimp.measureText(ubuntuB_lightblue_32, this_.playObjects[i].countsObject.count_300 + " / " + this_.playObjects[i].countsObject.count_100 + " / " + this_.playObjects[i].countsObject.count_50), 505 + (i * 275) + yMultiOffset + countY, " / ");
                            imageToEdit.print(ubuntuB_lightred_32, 915 - measurement + jimp.measureText(ubuntuB_lightblue_32, this_.playObjects[i].countsObject.count_300 + " / " + this_.playObjects[i].countsObject.count_100 + " / " + this_.playObjects[i].countsObject.count_50 + " / "), 505 + (i * 275) + yMultiOffset + countY, this_.playObjects[i].countsObject.count_miss);











                            if (this_.playObjects.length - 1 == i) {
                                globalInstances.logMessage("need to crop because its the last play");
                                if (doesSecondImageExist) {
                                    imageToEdit.crop(0, 485, 950, 775 + (i % 10) * 275 - 485)
                                } else {
                                    imageToEdit.crop(0, 0, 950, 775 + (i % 10) * 275)
                                }
                            } else if ((i + 1) % 10 == 0) {
                                globalInstances.logMessage("cropping because last play has been added");
                                if (doesSecondImageExist) {
                                    imageToEdit.crop(0, 485, 950, 775 + (9 * 275) - 485)
                                } else {
                                    imageToEdit.crop(0, 0, 950, 775 + (9 * 275))
                                }
                            }
                        }
                    })

                    setTimeout(function () {
                        globalInstances.logMessage("\nTrying to tweet...");

                        var reportNumber = globalInstances.reportNumber;
                        if (globalInstances.reportNumber == 5) {
                            globalInstances.reportNumber = 1;
                        } else {
                            globalInstances.reportNumber = globalInstances.reportNumber + 1;
                        }

                        if (doesFirstImageExist) {
                            data[0].write("./static/images/reports/report" + reportNumber + "_1.png");
                        }
                        if (doesSecondImageExist) {
                            data[1].write("./static/images/reports/report" + reportNumber + "_2.png");
                        }
                        if (doesThirdImageExist) {
                            data[2].write("./static/images/reports/report" + reportNumber + "_3.png");
                        }
                        if (doesFourthImageExist) {
                            data[3].write("./static/images/reports/report" + reportNumber + "_4.png");
                        }

                        setTimeout(function () {

                            var filename = "./static/images/reports/report" + reportNumber;
                            var params = { encoding: 'base64' }
                            var id = [];

                            var b64content;
                            if (doesFirstImageExist) {
                                b64content = fs.readFileSync(filename + "_1.png", params);
                                T.post('media/upload', { media_data: b64content }, function (err, data) {
                                    id.push(data.media_id_string)
                                    if (doesSecondImageExist) {
                                        b64content = fs.readFileSync(filename + "_2.png", params);
                                        T.post('media/upload', { media_data: b64content }, function (err, data) {
                                            id.push(data.media_id_string)
                                            if (doesThirdImageExist) {
                                                b64content = fs.readFileSync(filename + "_3.png", params);
                                                T.post('media/upload', { media_data: b64content }, function (err, data) {
                                                    id.push(data.media_id_string)
                                                    if (doesFourthImageExist) {
                                                        b64content = fs.readFileSync(filename + "_4.png", params);
                                                        T.post('media/upload', { media_data: b64content }, function (err, data) {
                                                            id.push(data.media_id_string)
                                                            this_.tweetReport(this_.twitterUsername, this_.osuUsername, id, this_.sessionID);
                                                        });
                                                    } else {
                                                        this_.tweetReport(this_.twitterUsername, this_.osuUsername, id, this_.sessionID);
                                                    }
                                                });
                                            } else {
                                                this_.tweetReport(this_.twitterUsername, this_.osuUsername, id, this_.sessionID);
                                            }
                                        });
                                    } else {
                                        this_.tweetReport(this_.twitterUsername, this_.osuUsername, id, this_.sessionID);
                                    }
                                });
                            } else {
                                globalInstances.logMessage("no images exist...? lol")
                            }
                        }, 10000)
                    }, 10000)
                })
            }).catch(err => {
                globalInstances.logMessage("-1" + err)
            });
        }).catch(err => {
            globalInstances.logMessage("-2" + err)
        });
    }

    tweetReport(twitterUsername, osuUsername, id, sessionID) {
        var tweet = { status: "." + twitterUsername + " just finished an osu! session: ", media_ids: [id] }
        T.post('statuses/update', tweet, function (err, _data) {
            if (err) {
                globalInstances.logMessage(err)
            }
            else {
                var sqlTweetIDUpdate = "UPDATE sessionsTable SET tweetID = '" + _data.id_str + "' WHERE sessionID = '" + sessionID + "'";
                globalInstances.logMessage(osuUsername + " - " + sqlTweetIDUpdate);
                db.serialize(() => {
                    db.run(sqlTweetIDUpdate);
                });
                globalInstances.logMessage(" ---------------------------------------------------------------------------------A tweet was tweeted")
            }
        })
    }
}

module.exports = sessionObject;
