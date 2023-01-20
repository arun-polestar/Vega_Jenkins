const redis = require('redis');
const { promisify } = require("util");
const webUrlLink = require('./config/config').webUrlLink;
const prefix = webUrlLink.split('.')[0].slice(webUrlLink.indexOf(':') + 3);
//console.log(prefix);

let client = redis.createClient();
const getAsyncAll = promisify(client.hgetall).bind(client);
const getAsync = promisify(client.hget).bind(client);
const getAsyncKey = promisify(client.get).bind(client);

client.on("error", function (error) {
  console.error(error);
  process.exit(1);
});

client.on("connect", function () {

});

/**
 * This function will insert or update a new candidate in hash
 * @param {String} key name of the hash in which data to be inserted
 * @param {String} field key againest data will insert in hash
 * @param {JSON} value Data of candidate
 */
module.exports.setCandidate = (key, field, value) => {
  key = `${prefix}_${key}`;
  client.HSET(key, field, value);
}


/**
 * This function return all field in specified hash in key
 * @param {String} key name of the hash in which data to be inserted
 */
module.exports.getAllCandidates = async function (key) {
  key = `${prefix}_${key}`;
  console.time("getAll");
  let res = await getAsyncAll(key);
  let values = res && Object.values(res);
  // values = Array.from(res);
  console.timeEnd("getAll");
  return values;
}

/**
 * This function will delete specified candidate in hash
 * @param {String} key name of the hash in which data to be inserted
 * @param {String} field key againest data will insert in hash
 */
module.exports.deleteCandidate = function (key, field) {
  key = `${prefix}_${key}`;
  client.hdel(key, field);
}


module.exports.getCandidateById = async function (key, id) {
  console.time("abc");
  //console.log("lllgog");
  key = `${prefix}_${key}`;
  let res = await getAsync(key, id);
  // values = Object.values(res).map(v => JSON.parse(v));
  values = res && Object.values(res);
  //console.log(values[475]);
  console.timeEnd("abc");
  return values;
}

module.exports.setGlobalKey = async function (key, value, expiry) {
  client.set(key, value, 'EX', expiry);
  //client.expireat(key, expiry)
}
module.exports.setClientwiseKey = async function (key, value, expiry) {
  const clientkey = `${prefix}_${key}`
  client.set(clientkey, value, 'EX', expiry);
  //client.expireat(key, expiry)
}

module.exports.getGlobalKey = async function (key) {
  let res = await getAsyncKey(key);
  ////console.log('values', res);
  //let values = res && Object.values(res);
  return res;
}
module.exports.getClientwiseKey = async function (key) {
  const clientkey = `${prefix}_${key}`
  let res = await getAsyncKey(clientkey);
  ////console.log('values', res);
  //let values = res && Object.values(res);
  return res;
}
// const uploadModel = require("./routes/common/Model");

// uploadModel.mysqlModelService('call usp_advance_search(?)', [12], function (err, results) {
//     if (err) {
//         //console.log("ERROR",err);
//         return;
//     }
//     // ResumeCompare();
//     let data = results[0];
//     //console.log("hdjshd",data[0]);
//     for(let i = 0; i < data.length;i++){

//         module.exports.setCandidate('candidates',`${i}`,JSON.stringify(data[i]));
//     }

// });