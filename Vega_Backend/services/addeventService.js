const { google } = require('googleapis');
const mailservice = require('./mailerService');
let jwtClient = null;
const async = require('async');
const uuidv4 = require('uuid').v4;
const { countBy } = require('underscore');
let privatekey = require('../assets/google_obj/googleApiObj').googleApiObj

module.exports = {
  addevent: addevent,
  deleteEvent: deleteEvent,
  updateEvent: updateEvent
};

function addevent(events, callback) {
  jwtClient = new google.auth.JWT(
    privatekey.client_email,
    null,
    privatekey.private_key,
    ['https://www.googleapis.com/auth/calendar']);
  //authenticate request
  jwtClient.authorize(function (err, tokens) {
    if (err) {
      //console.log('authorize errr', err);
      return callback(err);
    } else {
      addevents(events, callback);
    }
  });

}

function deleteEvent(events) {
  jwtClient = new google.auth.JWT(
    privatekey.client_email,
    null,
    privatekey.private_key,
    ['https://www.googleapis.com/auth/calendar']);
  //authenticate request
  jwtClient.authorize(function (err, tokens) {
    if (err) {
      // //console.log(err);
      return;
    } else {
      // //console.log("Successfully connected!");
      deleteEvents(events);
    }
  });
}


function deleteEvents(events) {
  var error = null;
  async.forEachOfSeries(events, function (item, key, next) {
    // //console.log(item);
    var params = {
      auth: jwtClient,
      calendarId: 'primary',
      eventId: item.eventid,
    };
    var calendar = google.calendar('v3');
    calendar.events.delete(params, function (err) {
      if (err) {
        // //console.log('The API returned an error: ' + err);
        error = "error Occured";
        next();
      } else {
        // //console.log('Event deleted.');
        next();
      }
    });
  }, function (err) {
    if (err) {
      // //console.log('A Event failed to delete in calendar');
      // //console.log(error);
    } else {
      // //console.log('All Events have been delete successfully');
      // //console.log(error);
    }
  });
}

function updateEvent(events, callback) {
  jwtClient = new google.auth.JWT(
    privatekey.client_email,
    null,
    privatekey.private_key,
    ['https://www.googleapis.com/auth/calendar']);
  //authenticate request
  jwtClient.authorize(function (err, tokens) {
    if (err) {
      //console.log(err);
      return callback(err);
    } else {
      // //console.log("Successfully connected!");
      updateEvents(events, callback);
    }
  });
}


function updateEvents(events, callback) {
  var caldata = [];
  var mailTitle = null;
  var emails = null;
  var error = null;
  var checkmodule = null;
  var mailtype = null;
  var info = null;
  var messageInterview = null; var resumelist = null;
  var interviewMailDate = null; var resumefilename = null;
  var jobtitle, trxinterviewstate;
  var rmsitemarr = {};
  async.forEachOfSeries(events, function (item, key, next) {
    var event = {};

    rmsitemarr = item;
    // //console.log('key', key);
    jobtitle = item.jobtitle ? item.jobtitle : null;
    interviewMailDate = item.interviewMailDate ? item.interviewMailDate : null;
    resumelist = item.resumelist ? item.resumelist : null;
    resumefilename = item.resumefilename ? item.resumefilename : null;
    messageInterview = item.messageInterview ? item.messageInterview : null;
    mailtype = item.mailType ? item.mailType : null;
    info = item.candidateInfo ? item.candidateInfo : null;
    trxinterviewstate = item.trxinterviewstate ? item.trxinterviewstate : null;
    mailTitle = item.title ? item.title : null;
    emails = item.emails ? item.emails : null;
    checkmodule = item.module ? item.module : null;
    event.summary = item.title ? item.title : null;
    event.location = item.location ? item.location : null;
    event.description = item.agenda ? item.agenda : null;
    event.start = {
      dateTime: item.starttime ? item.starttime : null,
      'timeZone': 'Asia/Kolkata',
    };
    event.end = {
      dateTime: item.endtime ? item.endtime : null,
      'timeZone': 'Asia/Kolkata',
    };
    event.recurrence = [
      'RRULE:FREQ=DAILY;COUNT=1'
    ];
    var emailids = [];
    var email = (item.emails).split(",");
    for (var index = 0; index < email.length; index++) {
      emailids.push({
        'email': email[index]
      });
    }
    event.notificationtime = item.notificationtime ? item.notificationtime : 10;
    // //console.log("event.notificationtime", event.notificationtime);
    event.attendees = emailids.length > 0 ? emailids : [];
    event.reminders = {
      'useDefault': false,
      'overrides': [
        { 'method': 'email', 'minutes': 24 * 60 },
        { 'method': 'popup', 'minutes': event.notificationtime },
      ],
    };
    //console.log('event sssss', event)
    if (event.summary && event.location && event.description && event.start.dateTime && event.end.dateTime && event.attendees.length > 0) {
      //console.log('inside it')
      var calendar = google.calendar('v3');
      calendar.events.update({
        auth: jwtClient,
        calendarId: 'primary',
        eventId: item.eventid,
        resource: event,
      }, function (err, event) {
        //console.log('Event updated: %s', err, event);
        if (err) {
          //console.log('There was an error contacting the Calendar service: ' + err);
          error = "Error Occured";
          next();
        } else {
          caldata[key] = {
            title: event.data.summary,
            frequencyid: item.frequencyid,
            eventid: event.data.id
          }
          //mailTitle = item.title;
          //emails = item.emails;
          /*var options = {
            subject: item.title,
            emailid: item.emails,
            starttime:item.starttime,
            endtime:item.endtime 
          };
          mailservice.sendCalenderInvites(options,function(err){
            if(err) {
              //console.log(err);
            }
          });*/
          next();
        }
      });
    } else {
      next("Please provide the all data");
    }
  }, function (err) {
    var optionsrms = rmsitemarr;

    optionsrms.subj = "Interview Rescheduled";
    optionsrms.subject = mailTitle + "  in your Calendar";
    optionsrms.emailid = emails;
    if (err) {
      // //console.log('A Event failed to add in calendar');
      // //console.log('All Events have been updated successfully');
      if (!checkmodule) {
        if (mailTitle) {
          var temptitle = mailTitle.split(" ");
          var ttl = "";
          for (var index = 0; index < temptitle.length - 1; index++) {
            if (index == 0) {
              ttl = temptitle[index];
            } else {
              ttl = ttl + " " + temptitle[index];
            }
          }
          var options = {
            subject: "Events For The Meeting " + ttl + " are updated in your Calendar",
            emailid: emails
          };
          mailservice.sendCalenderInvites(options, function (err) {
            if (err) {
              // //console.log(err);
            }
          });
        }
      }
      // //console.log('Title', mailTitle);
      // //console.log('checkmodule', checkmodule);
      // //console.log('emailsfirst', emails);
      if (checkmodule == 'RMS') {
        // var options = {
        // 	subj:"Interview Rescheduled",
        // 	jobtitle:jobtitle,
        // 	interviewMailDate:interviewMailDate,
        // 	resumelist : resumelist,
        // 	resumefilename:resumefilename,
        // 	messageInterview : messageInterview,
        // 	candidateInfo : info,
        // 	mailType: mailtype,
        // 	subject: mailTitle + "  in your Calendar",
        // 	emailid: emails
        // };
        mailservice.sendCalenderInvites(optionsrms, function (err) {
          if (err) {
            // //console.log(err);
          }
        });

      }
      callback(error, caldata);
    } else {
      // //console.log('All Events have been added successfully');
      if (!checkmodule) {
        if (mailTitle) {
          var temptitle = mailTitle.split(" ");
          var ttl = "";
          for (var index = 0; index < temptitle.length - 1; index++) {
            if (index == 0) {
              ttl = temptitle[index];
            } else {
              ttl = ttl + " " + temptitle[index];
            }
          }
          var options = {
            subject: "Events For The Meeting " + ttl + " are updated in your Calendar",
            emailid: emails
          };
          mailservice.sendCalenderInvites(options, function (err) {
            if (err) {
              // //console.log(err);
            }
          });
        }
      }
      // //console.log('Title', mailTitle);
      // //console.log('checkmodule', checkmodule);
      // //console.log('emails', emails);
      if (checkmodule == 'RMS') {
        // var options = {
        // 	subj:"Interview Rescheduled",
        // 	jobtitle:jobtitle,
        // 	interviewMailDate:interviewMailDate,
        // 	resumelist : resumelist,
        // 	resumefilename:resumefilename,
        // 	messageInterview : messageInterview,
        // 	candidateInfo : info,
        // 	mailType: mailtype,
        // 	subject: mailTitle + "  in your Calendar",
        // 	emailid: emails
        // };

        mailservice.sendCalenderInvites(optionsrms, function (err) {
          if (err) {
            //	 //console.log(err);
          }
        });

      }
      // //console.log('All Events have been updated successfully');
      callback(error, caldata);
    }
  });
}

function addevents(events, callback) {
  ////console.log('Insideeeeeeeeee add events');
  var caldata = [];
  var mailTitle = null;
  var emails = null;
  var error = null;
  var checkmodule = null;
  var mailtype = null;
  var info = null;
  var messageInterview = null; var resumelist = null;
  var interviewMailDate = null; var resumefilename = null;
  var jobtitle;
  var rmsitemarr = {};

  async.forEachOfSeries(events, function (item, key, next) {
    var event = {};
    // //console.log('key', key);
    // //console.log('itme', item);
    rmsitemarr = item;
    jobtitle = item.jobtitle ? item.jobtitle : null;
    interviewMailDate = item.interviewMailDate ? item.interviewMailDate : null;
    resumelist = item.resumelist ? item.resumelist : null;
    resumefilename = item.resumefilename ? item.resumefilename : null;
    messageInterview = item.messageInterview ? item.messageInterview : null;
    mailtype = item.mailType ? item.mailType : null;
    info = item.candidateInfo ? item.candidateInfo : null;
    mailTitle = item.title ? item.title : null;
    emails = item.emails ? item.emails : null;
    checkmodule = item.module ? item.module : null;
    event.summary = item.title ? item.title : null;
    event.location = item.location ? item.location : null;
    event.description = item.agenda ? item.agenda : null;
    event.start = {
      dateTime: item.starttime ? item.starttime : null,
      'timeZone': 'Asia/Kolkata',
    };
    event.end = {
      dateTime: item.endtime ? item.endtime : null,
      'timeZone': 'Asia/Kolkata',
    };
    event.recurrence = [
      'RRULE:FREQ=DAILY;COUNT=1'
    ];
    var emailids = [];
    var email = (item.emails) && (item.emails).split(",");
    for (var index = 0; index < email.length; index++) {
      emailids.push({
        'email': email[index]
      });
    }
    event.attendees = emailids.length > 0 ? emailids : [];
    event.reminders = {
      'useDefault': false,
      'overrides': [
        { 'method': 'email', 'minutes': 24 * 60 },
        { 'method': 'popup', 'minutes': 10 },
      ],
    };
    if (item.interviewlinkoption === 'meet') {
      event["conferenceData"] = {
        "createRequest": {
          "conferenceSolutionKey": {
            "type": "addOn"
          },
          "requestId": uuidv4(),
        }
      }
    }
    ////console.log('event', event);
    if (event.summary && event.location && event.description && event.start.dateTime && event.end.dateTime && event.attendees.length > 0) {
      var calendar = google.calendar('v3');
      ////console.log('add eventssssssssssssssss', jwtClient)
      calendar.events.insert({
        auth: jwtClient,
        calendarId: 'primary',
        resource: event,
        sendUpdates: 'all',
        conferenceDataVersion: item.interviewlinkoption === 'meet' ? 1 : 0
      }, function (err, event) {
        ////console.log(event,"sasaassasasaassasasasaassaas");
        if (err) {
          //console.log('There was an error contacting the Calendar service: ' + err);
          error = "Error Occured";
          checkmodule = item.module ? item.module : null;
          next();
        } else {
          caldata[key] = {
            title: event.data.summary,
            frequencyid: item.frequencyid,
            eventid: event.data.id
          }
          // mailTitle = item.title;
          // emails = item.emails;
          //console.log('Event created: %s', caldata);
          /*var options = {
            subject: item.title,
            emailid: item.emails,
            starttime:item.starttime,
            endtime:item.endtime 
          };
          mailservice.sendCalenderInvites(options,function(err){
            if(err) {
              //console.log(err);
            }
          });*/
          next();
        }
      });
    } else {
      next("Please provide the all data");
    }
  }, function (err) {
    var optionsrms = rmsitemarr;

    optionsrms.subj = "Interview Scheduled";
    optionsrms.subject = mailTitle + "  in your Calendar";
    optionsrms.emailid = emails;
    if (err) {
      // //console.log('Error', err);
      // //console.log('A Event failed to add in calendar');
      if (!checkmodule) {
        var temptitle = mailTitle.split(" ");
        var ttl = "";
        for (var index = 0; index < temptitle.length - 1; index++) {
          if (index == 0) {
            ttl = temptitle[index];
          } else {
            ttl = ttl + " " + temptitle[index];
          }
        }
        var options = {
          subject: "Events For The Meeting " + ttl + " are added in your Calendar",
          emailid: emails
        };
        mailservice.sendCalenderInvites(options, function (err) {
          if (err) {
            // //console.log(err);
          }
        });
      }
      // //console.log('Title', mailTitle);
      // //console.log('checkmodule', checkmodule);
      // //console.log('emails', emails);
      if (checkmodule == 'RMS') {
        // var options = {
        // 	subj:"Interview Scheduled",
        // 	jobtitle:jobtitle,
        // 	interviewMailDate:interviewMailDate,
        // 	resumelist : resumelist,
        // 	resumefilename:resumefilename,
        // 	messageInterview : messageInterview,
        // 	candidateInfo : info,
        // 	mailType: mailtype,
        // 	subject: mailTitle + " is added in your Calendar",
        // 	emailid:  emails
        // };
        mailservice.sendCalenderInvites(optionsrms, function (err) {
          if (err) {
            // //console.log(err);
          }
        });

      }
      callback(error, caldata);
    } else {
      // //console.log('All Events have been added successfully');
      if (!checkmodule) {
        var temptitle = mailTitle.split(" ");
        var ttl = "";
        for (var index = 0; index < temptitle.length - 1; index++) {
          if (index == 0) {
            ttl = temptitle[index];
          } else {
            ttl = ttl + " " + temptitle[index];
          }
        }
        var options = {
          subject: "Events For The Meeting " + ttl + " are added in your Calendar",
          emailid: emails
        };
        mailservice.sendCalenderInvites(options, function (err) {
          if (err) {
            // //console.log(err);
          }
        });
      }
      // //console.log('Title', mailTitle);
      // //console.log('checkmodule', checkmodule);
      // //console.log('emails', emails);
      if (checkmodule == 'RMS') {
        // var options = {
        // 	subj:"Interview Scheduled",
        // 	jobtitle:jobtitle,
        // 	interviewMailDate:interviewMailDate,
        // 	resumelist : resumelist,
        // 	resumefilename:resumefilename,
        // 	messageInterview : messageInterview,
        // 	candidateInfo : info,
        // 	mailType: mailtype,
        // 	subject: mailTitle + " is added in your Calendar",
        // 	title:mailTitle,
        // 	emailid: emails
        // };
        mailservice.sendCalenderInvites(optionsrms, function (err) {
          if (err) {
            // //console.log(err);
          }
        });

      }
      callback(error, caldata);
    }
  });
}