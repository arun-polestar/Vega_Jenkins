
var MailListener = require("mail-listener3");
var fs = require("fs");
var async = require("async");
const appRoot = require('app-root-path');
const { google } = require('googleapis');
const { extname, join } = require('path');
const { app, credential } = require("firebase-admin");

const config = require("../config/config");
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;


var name = [];
var content = [];
var subject = [];
var resumetempdir = '';

module.exports = {
  startListner: startListner,
  downloadAttachment: downloadAttachment
};

function startListner(maildata, callback) {
  if (maildata.emailid && maildata.password) {
    resumetempdir = maildata.resumetempdir;
    var mailListener = new MailListener({
      username: maildata.emailid,
      password: maildata.password,
      host: "imap.gmail.com",
      port: 993, // imap port
      tls: true,
      connTimeout: 10000, // Default by node-imap
      authTimeout: 5000, // Default by node-imap,
      debug: console.log, // Or your custom function with only one incoming argument. Default: null
      tlsOptions: { rejectUnauthorized: false },
      mailbox: "Inbox", // mailbox to monitor
      searchFilter: ['UNSEEN', ["SINCE", "Apr 15, 2018"]
      ], // the search filter being used after an IDLE notification has been retrieved
      markSeen: true, // all fetched email willbe marked as seen and not fetched next time
      fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
      mailParserOptions: { streamAttachments: false }, // options to be passed to mailParser lib.
      attachments: false, // download attachments as they are encountered to the project directory
      attachmentOptions: { directory: "attachments/" }, // specify a download directory for attachments
      // mailParserOptions: {streamAttachments: true},
    });
    mailListener.start(); // start listening

    // stop listening
    //mailListener.stop();

    mailListener.on("server:connected", function () {

      //console.log("imapConnected", new Date());
    });

    mailListener.on("server:disconnected", function () {
      //console.log("imapDisconnected", new Date());
      mailListener.start()
    });

    mailListener.on("error", function (err) {
      //console.log("error",err);
    });

    mailListener.on("mail", function (mail, seqno, attributes) {
      // do something with mail object including attachments
      //console.log("Mail  & Sequence No", seqno,mail);
      if (mail.attachments && mail.attachments.length) {
        for (var index = 0; index < mail.attachments.length; index++) {
          var attach = mail.attachments[index];
          //console.log('attach',attach.fileName);
          if (attach.fileName) {
            name.push(attach.fileName);
          } else {
            name.push("Resume");
          }
          content.push(attach.content);
          if (mail.subject) {
            subject.push(mail.subject.replace(" ", "_"));
          } else {
            subject.push('Resume');
          }
        }
      }

    });
    mailListener.on("done", function (attachment) {
      //console.log("No more messages");
      writefile(function (err, data) {
        if (err) {
          //console.log("error");
          callback(err, data);
        } else if (data) {
          //console.log("data");
          callback(err, data);
        } else {
          //console.log("No Output");
          callback(err, data);
        }
      })
      mailListener.stop();
    });

  } else {
    callback("Please Send the correct information", null);
  }

}

function writefile(callbackfun) {
  async.forEachOf(content, function (value, key, callback) {
    // fs.writeFile(dirnameMain+'/'+subject[key]+"~"+name[key].replace(" ", "_"), value, function(err) {
    fs.writeFile((appRoot && appRoot.path) + '/uploads/Recruitment/' + resumetempdir + '/' + subject[key] + "~" + name[key].replace(" ", "_"), value, function (err) {
      //fs.writeFile((appRoot && appRoot.path)+ '/uploads/attachments/'+subject[key]+"~"+name[key].replace(" ", "_"), value, function(err) {
      callback();
      // callback
    });
  }, function (err) {
    if (err) callbackfun(err, null);
    // configs is now a map of JSON data
    callbackfun(null, "Done");
  });
}


/**
 * New Email parser 
 */


/**
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function downloadAttachment(params) {
  return new Promise((resolve, reject) => {

    //Reading the client credential file
    fs.readFile(`${appRoot}/config/credentials.json`, async (err, credential) => {
      if (err) {
        //console.log('Error loading client secret file:', err);
        reject();
      }

      //Creating a new OAuth client and generating the varification url
      const { client_secret, client_id, redirect_uris } = JSON.parse(credential).web;
      const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      auth.setCredentials(params.token);

      //Reading email and fetching attachement
      //from all unread messages

      let messageIds = await listUnreadMessageId(auth);
      modifyLabel(auth, messageIds, params.levelId);
      let data = 0;
      let candidateMessage = [];
      for (let j = 0; j < messageIds.length; j++) {
        let messageId = messageIds[j];
        let { parts, headers } = await getMessageParts(auth, messageId);
        let rs = headers.filter(header => header.name == 'From')[0].value;
        let resumeSource = rs && rs.split('@') && rs.split('@')[1].replace('>', '');
        let mailSubject = headers.filter(header => header.name == 'Subject')[0].value;
        let msg = ''
        for (let i = 0; i < (parts && parts.length); i++) {

          let part = parts[i];
          if (part.filename && ['.pdf', '.doc', '.docx', '.rtf', '.txt'].indexOf(String(extname(part.filename)).toLowerCase()) > -1) {
            if (part.body.attachmentId) {
              await getAttachment(auth, messageId, part.body.attachmentId, join(params.dirname, part.filename));
              data = 1;
            }
          }
          if (part.mimeType == 'multipart/alternative') {
            //console.log('Inside');
            msg = await getMessageData(part.parts);
          }
          if (part.filename && ['.pdf', '.doc', '.docx', '.rtf', '.txt'].indexOf(String(extname(part.filename)).toLowerCase()) > -1) {
            candidateMessage.push({
              [part.filename]: {
                msg,
                resumeSource,
                mailSubject
              }
            })
          }
        }
      }
      if (data == 0) //console.log("no file found");
        resolve(candidateMessage);
    });
  });
}

/**
 * Lists the Ids of unread messages in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listUnreadMessageId(auth) {
  return new Promise((resolve, reject) => {
    const gmail = google.gmail({ version: 'v1', auth: auth });
    gmail.users.messages.list({
      userId: 'me',
      labelIds: ['UNREAD', 'INBOX'],
      includeSpamTrash: false
    }, (err, res) => {

      if (err) {
        //console.log('The API returned an error: ' + err)
        return reject();
      }

      let messages = res.data.messages;
      if (messages && messages.length) {
        let message = messages.map(message => message.id);
        resolve(message);
      }
      else {
        //console.log('No Unread Message found.')
        resolve([]);
      }
    });
  });
}


/**
 * Update the label of messsage
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function modifyLabel(auth, messageIds, levelId) {
  const gmail = google.gmail({ version: 'v1', auth: auth });
  gmail.users.messages.batchModify({
    userId: 'me',
    ids: messageIds,
    addLabelIds: [
      levelId
    ],
    removeLabelIds: [
      'UNREAD'
    ]
  }, (err, res) => {
    if (err) console.log('The API to modify returned an error: ' + err);

    //console.log('Lable has been modified');

  });
}


/**
 * Fetch the message with id
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * 
 * @param {String} messageId Message id of the email
 */
function getMessageParts(auth, messageId) {
  return new Promise((resolve, reject) => {
    const gmail = google.gmail({ version: 'v1', auth: auth });
    gmail.users.messages.get({
      userId: 'me',
      id: messageId,
    }, (err, res) => {

      if (err) {
        //console.log('The API returned an error: ', err);
        return reject();
      }

      return resolve(res.data.payload);
    });
  });
}


/**
 * Fetch the attachments with id
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function getAttachment(auth, messageId, attachmentId, filename) {
  return new Promise((resolve, reject) => {
    const gmail = google.gmail({ version: 'v1', auth: auth });
    gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: messageId,
      id: attachmentId
    }, (err, res) => {
      if (err) {
        //console.log('The API returned an error: ' , err)
        reject();
      }
      let data = Buffer.from(res.data.data, 'base64');
      //console.log(data);
      fs.writeFile(filename, data, (err) => {
        if (err) {
          //console.log("Error in dowloading attachments",err);
          reject();
        }
        //console.log("Attachments downloaded successfully!");
        resolve();
      });
    });

  });
}
function getMessageData(partArray) {
  return new Promise((resolve, reject) => {
    if (partArray && partArray.length) {
      for (let i = 0; i < partArray.length; i++) {
        if (partArray[i].mimeType == 'text/plain') {
          let messageData = Buffer.from(partArray[i].body.data, 'base64')
            .toString('ascii')
          return resolve(messageData);
        }
      }
    }
    resolve('');
  })
}



