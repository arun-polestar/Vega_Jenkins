'use strict';

var uniqid = require('uniqid');
var crypto = require('crypto');
var NodeCache = require('persistent-cache');
const servercache = new NodeCache();
var _ = require('lodash');
var moment = require('moment');
const messages = require("./messages");
const query = require('../routes/common/Model').mysqlPromiseModelService;
const proc = require('../routes/common/procedureConfig');

var tokenconfig = require('../config/config').expiryconfig;

function getIndex(arr, value) {
  return arr.findIndex(item => { if (item.includes(value)) return item })
}

module.exports = {
  generateRandomString: function (Length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < Length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  },
  generateRandomNumber: function (Length) {
    var number = "";
    var possible = "0123456789";
    for (var i = 0; i < Length; i++) {
      number += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return number;
  },
  generateToken: function (loginid, ipaddress) {

    var tokenstring = "";
    var uniqstring = uniqid();
    tokenstring = tokenstring + Math.random().toString(36).substring(2, 30) + Math.random().toString(36).substring(2, 30);
    tokenstring = tokenstring + loginid;
    tokenstring = tokenstring + uniqstring;
    tokenstring = tokenstring + (new Date().valueOf());
    tokenstring = tokenstring + Math.random().toString(36).substring(2, 30) + Math.random().toString(36).substring(2, 30);
    tokenstring = tokenstring + ipaddress;
    const cipher = crypto.createCipher('aes192', "45465454564545s4d5sd4s5d4d54");
    let encrypted = '';

    const buf = crypto.randomBytes(45);
    var buf_str = buf.toString('hex');
    return buf_str + tokenstring;
  },
  saveTokenInCache: function (object, token, callback) {
    if (object.type == 'company') {
      var temparr = servercache.getSync('companytokens');
      if (temparr) {
        var index = _.findIndex(temparr, { "login_id": object.login_id, "type": object.type });
        if (index > -1) {
          temparr[index].tokens.push(token);
        } else {
          temparr.push(object);
        }
        servercache.delete('companytokens', function (error) {
          if (error) {
            servercache.delete('companytokens', function (err) {
              if (err) {
                return callback('error', null);
              } else {
                servercache.putSync('companytokens', temparr);
                // console.log('companytokens',JSON.stringify(servercache.getSync('companytokens')));
                return callback(null, "success");
              }
            });
          } else {
            servercache.putSync('companytokens', temparr);
            // console.log('companytokens',JSON.stringify(servercache.getSync('companytokens')));
            return callback(null, "success");
          }
        });
      } else {
        servercache.putSync('companytokens', [object]);
        // console.log('companytokens',JSON.stringify(servercache.getSync('companytokens')));
        return callback(null, "success");
      }
    } else {
      var temparr = servercache.getSync('usertokens');
      if (temparr) {
        var index = _.findIndex(temparr, { "login_id": object.login_id, "type": object.type });
        if (index > -1) {
          temparr[index].tokens.push(token);
        } else {
          temparr.push(object);
        }
        servercache.delete('usertokens', function (error) {
          if (error) {
            servercache.delete('usertokens', function (err) {
              if (err) {
                return callback('error', null);
              } else {
                servercache.putSync('usertokens', temparr);
                // console.log('servercache.get(usertokens)',JSON.stringify(servercache.getSync('usertokens')));
                return callback(null, "success");
              }
            });
          } else {
            servercache.putSync('usertokens', temparr);
            // console.log('servercache.get(usertokens)',JSON.stringify(servercache.getSync('usertokens')));
            return callback(null, "success");
          }
        });
      } else {
        servercache.putSync('usertokens', [object]);
        // console.log('servercache.get(usertokens)',JSON.stringify(servercache.getSync('usertokens')));
        return callback(null, "success");
      }
    }
  },
  checkCompanyExpiry: function () {
    var temparr = servercache.getSync('companytokens');
    if (temparr) {
      // console.log('oldtemparr',JSON.stringify(servercache.getSync('companytokens')));
      _.map(temparr, function (item) {
        for (var index = 0; index < item.tokens.length; index++) {
          var tokentime = item.tokens[index].time;
          var tempcurrenttime = moment().format('YYYY-MM-DD h:mm:ss a');
          var currenttime = moment(tempcurrenttime, 'YYYY-MM-DD h:mm:ss a');
          var pasttiem = moment(tokentime, 'YYYY-MM-DD h:mm:ss a');
          // /*console.log('currenttime',currenttime);
          // console.log('pasttiem',pasttiem);*/
          var d = moment.duration(currenttime.diff(pasttiem));
          if (((d._data.hours + ((d._data.minutes > 58) ? 1 : 0)) > tokenconfig.expiretime) || (d._data.days > 0) || (d._data.months > 0) || (d._data.years > 0)) {
            item.tokens[index].flag = false;
          }
          // console.log('d',d._data.hours*60+d._data.minutes);
        }
        var newarr = _.filter(item.tokens, { 'flag': true });
        item.tokens = newarr;
      });
      servercache.delete('companytokens', function (error) {
        if (error) {
          servercache.delete('companytokens', function (err) {
            if (err) {
              //  console.log('oldtemparr',JSON.stringify(servercache.getSync('companytokens')));
            } else {
              servercache.putSync('companytokens', temparr);
              // console.log('oldtemparr',JSON.stringify(servercache.getSync('companytokens')));
            }
          });
        } else {
          servercache.putSync('companytokens', temparr);
          // console.log('oldtemparr',JSON.stringify(servercache.getSync('companytokens')));
        }
      });
    }
  },
  checkUserExpiry: function () {
    var temparr = servercache.getSync('usertokens');
    if (temparr) {
      // console.log('oldtemparr',JSON.stringify(servercache.getSync('usertokens')));
      _.map(temparr, function (item) {
        for (var index = 0; index < item.tokens.length; index++) {
          var tokentime = item.tokens[index].time;
          var tempcurrenttime = moment().format('YYYY-MM-DD h:mm:ss a');
          var currenttime = moment(tempcurrenttime, 'YYYY-MM-DD h:mm:ss a');
          var pasttiem = moment(tokentime, 'YYYY-MM-DD h:mm:ss a');
          // console.log('currenttime',currenttime);
          // console.log('pasttiem',pasttiem);
          var d = moment.duration(currenttime.diff(pasttiem));
          // console.log('d',d);
          if (((d._data.hours + ((d._data.minutes > 58) ? 1 : 0)) > tokenconfig.expiretime) || (d._data.days > 0) || (d._data.months > 0) || (d._data.years > 0)) {
            item.tokens[index].flag = false;
          }
          // console.log('d',d._data.hours+((d._data.minutes>44)?1:0));
        }
        var newarr = _.filter(item.tokens, { 'flag': true });
        item.tokens = newarr;
      });
      servercache.delete('usertokens', function (error) {
        if (error) {
          servercache.delete('usertokens', function (err) {
            if (err) {
              // console.log('oldtemparr',JSON.stringify(servercache.getSync('usertokens')));
            } else {
              servercache.putSync('usertokens', temparr);
              // console.log('oldtemparr',JSON.stringify(servercache.getSync('usertokens')));
            }
          });
        } else {
          servercache.putSync('usertokens', temparr);
          // console.log('oldtemparr',JSON.stringify(servercache.getSync('usertokens')));
        }
      });
    }
  },
  checkTokeninCache: function (object, callback) {
    var temparr = [];
    if (object.type == 'company') {
      temparr = servercache.getSync('companytokens');
      //  console.log('oldtemparr',JSON.stringify(servercache.getSync('companytokens')));
    } else {
      temparr = servercache.getSync('usertokens');
      // console.log('oldtemparr',JSON.stringify(servercache.getSync('usertokens')));
    }
    if (temparr) {
      var index = _.findIndex(temparr, { "login_id": object.login_id, "type": object.type });
      if (index > -1) {
        var tokenindex = _.findIndex(temparr[index].tokens, { "token": object.token });
        if (tokenindex > -1) {
          //return true;
          var tokentime = moment().format('YYYY-MM-DD h:mm:ss a');
          temparr[index].tokens[tokenindex].time = tokentime;
          // console.log("hello")
        } else {
          return callback(null, false);
        }
      } else {
        return callback(null, false);
      }
      if (object.type == 'company') {
        servercache.delete('companytokens', function (error) {
          if (error) {
            servercache.delete('companytokens', function (err) {
              if (err) {
                return callback(err, null);
              } else {
                servercache.putSync('companytokens', temparr);
                // console.log('oldtemparr',JSON.stringify(servercache.getSync('companytokens')));
                return callback(null, true);
              }
            });
          } else {
            servercache.putSync('companytokens', temparr);
            // console.log('oldtemparr',JSON.stringify(servercache.getSync('companytokens')));
            return callback(null, true);
          }
        });
      } else {
        servercache.delete('usertokens', function (error) {
          if (error) {
            servercache.delete('usertokens', function (err) {
              if (err) {
                return callback(err, null);
              } else {
                servercache.putSync('usertokens', temparr);
                // console.log('oldtemparr',JSON.stringify(servercache.getSync('usertokens')));
                return callback(null, true);
              }
            });
          } else {
            servercache.putSync('usertokens', temparr);
            // console.log('oldtemparr',JSON.stringify(servercache.getSync('usertokens')));
            return callback(null, true);
          }
        });
      }
    } else {
      return callback(null, false);
    }
  },
  deleteTokeninCache: function (object, callback) {
    var temparr = [];
    if (object.type == 'company') {
      temparr = servercache.getSync('companytokens');
      //  console.log('oldtemparr',JSON.stringify(servercache.getSync('companytokens')));
    } else {
      temparr = servercache.getSync('usertokens');
      // console.log('oldtemparr',JSON.stringify(servercache.getSync('usertokens')));
    }
    if (temparr) {
      var index = _.findIndex(temparr, { "login_id": object.login_id, "type": object.type });
      if (index > -1) {
        var tokenindex = _.findIndex(temparr[index].tokens, { "token": object.token });
        if (tokenindex > -1) {

          // console.log("hello")
          _.remove(temparr[index].tokens, { "token": object.token });
        } else {
          return callback(null, false);
        }
      } else {
        return callback(null, false);
      }
      if (object.type == 'company') {
        servercache.delete('companytokens', function (error) {
          if (error) {
            servercache.delete('companytokens', function (err) {
              if (err) {
                return callback(err, null);
              } else {
                servercache.putSync('companytokens', temparr);
                // console.log('oldtemparr',JSON.stringify(servercache.getSync('companytokens')));
                return callback(null, true);
              }
            });
          } else {
            servercache.putSync('companytokens', temparr);
            // console.log('oldtemparr',JSON.stringify(servercache.getSync('companytokens')));
            return callback(null, true);
          }
        });
      } else {
        servercache.delete('usertokens', function (error) {
          if (error) {
            servercache.delete('usertokens', function (err) {
              if (err) {
                return callback(err, null);
              } else {
                servercache.putSync('usertokens', temparr);
                // console.log('oldtemparr',JSON.stringify(servercache.getSync('usertokens')));
                return callback(null, true);
              }
            });
          } else {
            servercache.putSync('usertokens', temparr);
            // console.log('oldtemparr',JSON.stringify(servercache.getSync('usertokens')));
            return callback(null, true);
          }
        });
      }
    } else {
      return callback(null, false);
    }
  },
  deleteUserinCache: function (object, callback) {
    var temparr = [];
    if (object.type == 'company') {
      temparr = servercache.getSync('companytokens');
      //  console.log('oldtemparr',JSON.stringify(servercache.getSync('companytokens')));
    } else {
      temparr = servercache.getSync('usertokens');
      // console.log('oldtemparr',JSON.stringify(servercache.getSync('usertokens')));
    }
    if (temparr) {
      var index = _.findIndex(temparr, { "login_id": object.login_id, "type": object.type });
      if (index > -1) {
        _.remove(temparr, { "login_id": object.login_id, "type": object.type });
      } else {
        return callback(null, false);
      }
      if (object.type == 'company') {
        servercache.delete('companytokens', function (error) {
          if (error) {
            servercache.delete('companytokens', function (err) {
              if (err) {
                return callback(err, null);
              } else {
                servercache.putSync('companytokens', temparr);
                // console.log('oldtemparr',JSON.stringify(servercache.getSync('companytokens')));
                return callback(null, true);
              }
            });
          } else {
            servercache.putSync('companytokens', temparr);
            // console.log('oldtemparr',JSON.stringify(servercache.getSync('companytokens')));
            return callback(null, true);
          }
        });
      } else {
        servercache.delete('usertokens', function (error) {
          if (error) {
            servercache.delete('usertokens', function (err) {
              if (err) {
                return callback(err, null);
              } else {
                servercache.putSync('usertokens', temparr);
                // console.log('oldtemparr',JSON.stringify(servercache.getSync('usertokens')));
                return callback(null, true);
              }
            });
          } else {
            servercache.putSync('usertokens', temparr);
            // console.log('oldtemparr',JSON.stringify(servercache.getSync('usertokens')));
            return callback(null, true);
          }
        });
      }
    } else {
      return callback(null, false);
    }
  },
  /**
 * Validation on params
 * ``` js
 * appUtils.validator({
 *  container: params, 
 *  fields: [
 *    { key: 'partner_id', trimmed: true, type: 'id' }
 *  ],
 *  return: false, //If false it will throw error otherwise return validator boolean
 * })
 * ```
 * @param obj Object contain validation rules
 */
  validator: function (obj, callback) {
    //console.log(obj, "OBJJJJJJ----");
    obj = {
      container: obj.container || {},
      return: obj.return || false,
      fields: obj.fields || []
    };
    let isValid = true;
    let message = "";

    for (field of obj.fields) {

      let value = obj.container[field.key];
      isUndefined = (value == undefined);
      //console.log(field, "Each Fielddd", isUndefined, "Is Undddd");
      //should be required
      if ((field.required || field.trimmed) && value == undefined) {
        isValid = false;
        message = messages.missingKey.replace("{key}", field.key);
        break;
      }

      //should be trimmed
      if (!isUndefined && field.trimmed && value.trim() == "") {
        isValid = false;
        message = messages.invalidValue.replace("{key}", field.key);
        break;
      }

      //should be integer id
      if (!isUndefined && field.type == 'id' && (parseInt(value) != value || value == '0')) {
        isValid = false;
        message = messages.invalidIntegerValue.replace("{key}", field.key);
        break;
      }

      //should be valid email
      if (!isUndefined && field.type == 'email' && !value.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
        isValid = false;
        message = messages.invalidValue.replace("{key}", field.key);
        break;
      }

      //should be integer or float
      if (!isUndefined && field.type == 'number' && !value.match(/^-?\d*(\.\d+)?$/)) {
        isValid = false;
        message = messages.invalidValue.replace("{key}", field.key);
        break;
      }

      if (!isUndefined && field.type == 'between' && !(value >= field.range[0] && value <= field.range[1])) {
        isValid = false;
        message = messages.invalidValue.replace("{key}", field.key);
        break;
      }

      if (!isUndefined && field.type == 'in') {
        field.match = field.match.map(v => String(v));
        if (field.match.indexOf(value) === -1) {
          isValid = false;
          message = messages.invalidValue.replace("{key}", field.key);
          break;
        }
      }
    }
    //console.log(message, "Isvalidddddddd");
    if (obj.return) {
      return isValid;

    } else if (!isValid) {
      return ({ isvaid: isvalid, message: message });
      // throw exceptions.badRequestError(message);
    }
  },
  getResumeSourceID: async function (resumeSource) {
    try {
      if (!resumeSource) return null;
      const obj = JSON.stringify({
        ccode: 'rmsResumeSource',
        configvalue1: resumeSource,
        action: 'id_byconfigvalue',
        createdby: 1
      });

      /**
       * Getting Resume Source Id from database
       */
      let [results] = await query(proc.mstconfigview, [obj])
      let resumeSourceID = results[0].id
      return resumeSourceID;
    } catch (err) {
      //console.log('Error in getResumeSourceID-->', err)
      return null;
    }


  },


  parseNaukriTemplate: async function (subject, messageData) {

    let message = messageData.split("\r\n")
    //console.log('message', message);
    let jobTitle = messageData.includes('Job Title') ? message[message.indexOf('Job Title') + 1] : undefined;
    let expYears = messageData.includes('Exp') ? message[message.indexOf('Exp') + 1].toString().split(' years')[0] : 0;
    let expMonths = messageData.includes('Exp') ? message[message.indexOf('Exp') + 1].toString().split(' months')[0].substr(-2) : 0;
    let location = messageData.includes('Location') ? message[message.indexOf('Location') + 1] : undefined;
    let keySkills = 'NA'
    if (messageData.includes('Key Skills')) {
      let skills = [];
      for (let i = getIndex(message, 'Key Skills'); i < message.indexOf('Exp'); i++) {
        skills.push(message[i]);
      }
      keySkills = skills.toString().replace('Key Skills ', '');
    }

    let noticePeriod = messageData.includes('Notice Period') ? message[getIndex(message, 'Notice Period')].toString().split('Notice Period ')[1].substr(0, 2) : undefined;
    let contactNo = messageData.includes('Mobile:') ? message[getIndex(message, 'Mobile:')].toString().split('Mobile: ')[1] : undefined;
    let preferredLoc = messageData.includes('Prefers ') ? message[getIndex(message, 'Prefers')].toString().split('Prefers ')[1] : undefined;
    let qualification = messageData.includes('Education') ? message[message.indexOf('Education') + 1] : undefined;
    let institute = messageData.includes('Education') ? message[message.indexOf('Education') + 2] : undefined;
    let organization = messageData.includes('Current Company') ? message[getIndex(message, 'Current Company')].toString().split('Current Company ')[1] : undefined;
    let currDesig = messageData.includes('Current Designation') ? message[getIndex(message, 'Current Designation')].toString() : undefined
    let prevDesig = messageData.includes('Previous Designation') ? message[getIndex(message, 'Previous Designation')].toString() : undefined
    let exptext = `${currDesig}, ${prevDesig}`;
    let ctc = messageData.includes('CTC') ? message[message.indexOf('CTC') + 1] : undefined;
    return {
      jobTitle, expYears, expMonths,
      location, keySkills, noticePeriod,
      contactNo, preferredLoc, qualification,
      institute, organization, exptext, ctc,
      mailbody: messageData
    }
  }
}