const path = require("path");
const fs = require("fs");
const appRoot = require("app-root-path");
const archiver = require("archiver");
const { v4: uuidv4 } = require("uuid");
const config = require("../../config/config");
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;

/**
 * @description This function `remove all the falsey like value` and some falsey value
 * @param {Object} data -An Object to remove falsey Like value
 * @returns {Promise} A Promise data with all removed falsey like value
 */
async function removeFalseyLike(data) {
  for (const key in data) {
    let val = data[key];
    //Check if nested Array of Object preset The Loop it
    if (Array.isArray(val) && val.length > 0) {
      for await (item of val) {
        removeFalseyLike(item);
      }
    }
    if (
      val == "null" ||
      (typeof val === "string" && val.trim() == "") ||
      val === null ||
      typeof val === "undefined" ||
      (typeof val === "number" && isNaN(val)) ||
      val == "undefined" ||
      (Array.isArray(val) && val.length == 0) ||
      (val instanceof Object && Object.keys(val).length == 0)
    )
      delete data[key];
    // Check if any nested object preset the check for falsy value inside that
    if (
      !Array.isArray(val) &&
      val instanceof Object &&
      Object.keys(val).length
    ) {
      val = await removeFalseyLike(val);
    }
  }
  return data;
}

/**
 * @description check,if directories exists at given location if not exists then create it.
 * @param {String} d -full path
 * @returns {String} generated full path
 */
function makeDirectories(d) {
  const dest = getFullPath(d);
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  return dest;
}

/**
 *
 * @param {String} dataString Base64 string of file
 * @returns Stream of zipped data
 *
 */
function decodeBase64File(dataString) {
  const matches = dataString.match(/^data:([A-Za-z-+\/\.]+);base64,(.+)$/),
    res = {};
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid input string");
  }
  res.type = matches[1];
  res.data = Buffer.from(matches[2], "base64");
  return res;
}
/**
 *
 * @param {Object[]} req Express `res` parameter for sending response to client
 * @param {Object} res Express `res` parameter for sending response to client
 * @param {Array} req[].pathArray  Array of object of  `name` and `path`
 *
 */

function downloadzip(req, res) {
  const pathArray = req.body.pathArray;
  if (pathArray && pathArray && pathArray.length) {
    if (pathArray.length === 1) {
      if (pathArray[0].path.includes("uploads")) {
        return res.download(
          path.join(appRoot && appRoot.path, pathArray[0].path)
        );
      } else {
        return res.download(
          path.join(appRoot && appRoot.path, "uploads", pathArray[0].path)
        );
      }
    }
    const archive = archiver("zip");
    archive.on("close", () =>
      console.log("Archive wrote %d bytes.", archive.pointer())
    );
    archive.on("end", () =>
      console.log("Archive wrote %d bytes.", archive.pointer())
    );
    archive.on("warning", (err) => {
      if (err.code === "ENOENT") {
        console.warn("Zip File Warning", err);
      } else {
        throw err;
      }
    });
    archive.on("error", (err) => {
      throw err;
    });
    const filename = uuidv4() + ".zip";
    //set http headers
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-disposition", "attachment; filename=" + filename);

    //this is the streaming magic
    archive.pipe(res);
    // append a file from seam
    pathArray.forEach((item) => {
      let filePath;
      let downloadPath;
      if (!item.path.includes("uploads")) {
        filePath = path.join(appRoot && appRoot.path, "uploads", item.path);
        downloadPath = path.join("/uploads", item.path);
      } else {
        filePath = path.join(appRoot && appRoot.path, item.path);
        downloadPath = item.path;
      }
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: item.name });
      }
    });
    archive.finalize();
  } else {
    return res.json({ state: -1, message: "Invalid Request" });
  }
}
function numberInWords(num) {
  var a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  var b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if ((num = num.toString()).length > 9) return "overflow";
  n = ("000000000" + num)
    .substr(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return;
  var str = "";
  str +=
    n[1] != 0
      ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "Crore "
      : "";
  str +=
    n[2] != 0
      ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "Lakh "
      : "";
  str +=
    n[3] != 0
      ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "Thousand "
      : "";
  str +=
    n[4] != 0
      ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "Hundred "
      : "";
  str += n[5] != 0 ? a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]] : "";
  return str;
}

/**
 * @description This function throws error if any mandatory field missing
 * @param {Object} body -An Object to validate for any null/empty value
 * @returns error if mandatory field value is missing
 */
const validateReqBody = async (body) => {
  try {
    for (const key in body) {
      const value = body[key];
      // Check if nested Array of Object preset the loop it
      if (Array.isArray(value) && value.length > 0) {
        for await (data of value) {
          validateReqBody(data);
        }
      }
      if (body.hasOwnProperty(key)) {
        const val =
          body[key] == "null" ||
          (typeof body[key] === "string" && body[key].trim() == "") ||
          body[key] === null ||
          typeof body[key] === "undefined" ||
          (typeof body[key] === "number" && isNaN(body[key])) ||
          body[key] == "undefined" ||
          (Array.isArray(body[key]) && body[key].length == 0) ||
          (body[key] instanceof Object && Object.keys(body[key]).length == 0)
            ? { error: "Error" }
            : body[key];
        if (val.error === "Error") {
          throw new Error(`${key} is a mandatory field. Kindly provide.`);
        }
      }
    }
  } catch (err) {
    throw err;
  }
};

/**
 * @description - Get full path where all files are uploaded
 * @param {String} filepath -Filepath inside uploads folder with or without filename
 * @param {String} [filename] -filename inside uploaded folder
 * @returns full path of file where it stored
 */
function getFullPath(filepath, filename) {
  const originalRootDirectory = path.join(__dirname + '../../../')
  const rootDirectories = config.UPLOAD_DIRECTORY_PATH || appRoot.path;
  const uploads = "uploads";
  const assets = "assets";
  if (filepath && filename) {
    filepath = path.join(filepath, filename);
  }

  if (
    !(filepath.startsWith(uploads) || filepath.startsWith(`/${uploads}`)) &&
    !(filepath.startsWith(assets) || filepath.startsWith(`/${assets}`))
  ) {
    filepath = path.join(uploads, filepath);
  }
  let file_path
  if (filepath.includes('assets')) {
    file_path = path.join(originalRootDirectory, filepath);
  } else {
    file_path = path.join(rootDirectories, filepath)
  }
  return file_path;
}

function getFileLocation(files) {
  return new Promise((resolve) => {
    const filepath = [];
    const filename = [];
    const modifiedname = [];
    const fullfilepath = [];
    if (files && Array.isArray(files)) {
      files.forEach((file) => {
        filepath.push(file.filepath);
        filename.push(file.originalname);
        modifiedname.push(file.filename);
        fullfilepath.push(file.fullfilepath);
      });
    } else if (files && !Array.isArray(files)) {
      filepath.push(files.filepath);
      filename.push(files.originalname);
      modifiedname.push(files.filename);
      fullfilepath.push(files.fullfilepath);
    }
    resolve({
      filepath: filepath.toString(),
      filename: filename.toString(),
      modifiedname: modifiedname.toString(),
      fullfilepath: fullfilepath.toString(),
    });
  });
}

const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/; // (Minimum Length 8 Characters, including at least one number and includes both lower and uppercase letters and special characters, for example #, ?, !)
function isValidPasswordRegex(str) {
  return PASSWORD_REGEX.test(str);
}

module.exports = {
  makeDirectories,
  removeFalseyLike,
  decodeBase64File,
  downloadzip,
  numberInWords,
  getFullPath,
  getFileLocation,
  validateReqBody,
  isValidPasswordRegex,
};
