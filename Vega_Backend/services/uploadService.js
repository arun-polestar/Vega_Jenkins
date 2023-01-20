const path = require("path");
const async = require("async");
const { constant } = require("lodash");
const { makeDirectories } = require("../routes/common/utils");

module.exports = {
  uploadmultipledoc: uploadmultipledoc,
  uploadMultiple: uploadMultiple,
};

function uploadmultipledoc(data, path1) {
  return new Promise((resolve, reject) => {
    var checkdir = makeDirectories(path1);
    var filelength = 0;
    if (Array.isArray(data.files.file)) {
      filelength = data.files.file.length;
    } else {
      filelength = 1;
    }
    var filesUploaded = [];
    async.times(
      filelength,
      (n, next) => {
        var obj;
        if (filelength == 1) {
          obj = data.files["file"];
        } else {
          obj = data.files.file[n];
          //obj = data.files['file['+n+']'];
        }
        var sampleFile = obj;
        if (sampleFile) {
          let timestamp = Date.now();
          let filepath1 = path.join(checkdir, timestamp + sampleFile.name);
          let filepathfordb = path
            .join(path1, +timestamp + sampleFile.name)
            .replace("/uploads", "");
          sampleFile.mv(filepath1, (err) => {
            if (!err) {
              filesUploaded.push({
                filename: timestamp + sampleFile.name,
                filepath: filepath1,
                filepathfordb: filepathfordb,
              });
            }
            next(null, "success");
          });
        } else {
          next(null, "success");
        }
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(filesUploaded);
        }
      }
    );
  });
}

function uploadMultiple(req, folderName, attachCount) {
  return new Promise((resolve, reject) => {
    const checkdir = makeDirectories(path.join("uploads", folderName));
    let filelength = attachCount || 0;
    let filename = [];
    let filepath = [];
    async.times(
      filelength,
      (n, next) => {
        let sampleFile = {};
        sampleFile = req.files["file[" + n + "]"];
        //filelength == 1 ? req.files['file'] : req.files["file[" + n + "]"]
        if (sampleFile) {
          let timestamp = Date.now().toString();
          let filepath1 = path.join(
            checkdir,
            timestamp + sampleFile.name.trim().replace(/ /g, "")
          );
          let filepathfordb = path.join(
            folderName,
            timestamp + sampleFile.name.trim().replace(/ /g, "")
          );
          sampleFile.mv(filepath1, (err) => {
            if (!err) {
              // filename.push(path.join(timestamp + sampleFile.name.trim().replace(/ /g, '')))
              filename.push(sampleFile.name.trim().replace(/ /g, ""));
              filepath.push(filepathfordb);
            }
            next(null, "success");
          });
        } else {
          next(null, "success");
        }
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve({ filename, filepath });
        }
      }
    );
  });
}
