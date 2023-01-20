"use strict";
const { v4 } = require("uuid");
const { makeDirectories } = require("../common/utils");
const path = require("path");
module.exports = class Uploads {
  allowMime =
    /jpeg|jpg|png|gif|text|plain|csv|xls|xlsx|xlsm|vnd.ms-excel|excel|x-excel|x-msexcel|vnd.openxmlformats-officedocument.spreadsheetml.sheet|octet-stream|pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|plain|doc|docx|ppt|pptx|vnd.ms-powerpoint|vnd.openxmlformats-officedocument.presentationml.presentation/;
  constructor(filepath = "uploads", fieldname = "file") {
    this.filepath = filepath;
    this.fieldname = fieldname;
  }
  checkExtension(file) {
    if (file) {
      //check extention
      const extname = this.allowMime.test(
        path.extname(file.name).toLowerCase()
      );
      //check mime
      const mimeflag = this.allowMime.test(file.mimetype);
      if (mimeflag && extname) return true;
      else new Error("Error! File not supported");
    }
  }

  async uploadFile(file) {
    if (file) {
      this.checkExtension(file);
      const filename = `${v4()}_${file.name?.replace(/,/g, "")}`;
      const dir = makeDirectories(this.filepath);
      const fullpath = path.join(dir, filename);
      await file.mv(fullpath);
      return {
        fullfilepath: fullpath,
        filepath: path.join(this.filepath, filename),
        filename: filename,
        originalname: file.name,
      };
    }
  }

  singleFile = async (req, res, next) => {
    try {
      const file = req.files && req.files[this.fieldname];
      req.file = { ...file, ...(await this.uploadFile(file)) };
      delete req.files;
      next();
    } catch (error) {
      next(error);
    }
  };

  multipleFile = async (req, res, next) => {
    const flaggedFiles = { ...req.files };
    req.files = [];
    try {
      if (typeof this.fieldname === "boolean") {
        for (let key in flaggedFiles) {
          flaggedFiles[key] = {
            ...flaggedFiles[key],
            ...(await this.uploadFile(flaggedFiles[key])),
          };
          req.files.push(flaggedFiles[key]);
        }
      } else {
        let files = flaggedFiles && flaggedFiles[this.fieldname];
        if (!Array.isArray(files)) {
          files = [files];
        }
        if (files && files.length) {
          for (let file of files) {
            file = { ...file, ...(await this.uploadFile(file)) };
            req.files.push(file);
          }
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
