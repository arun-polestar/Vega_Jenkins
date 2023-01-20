// "use strict";
// const { extname } = require("path");
// const multer = require("multer");
// // const ALLOW_FILE_TYPE =
// //   "/jpeg|jpg|png|gif|text|plain|csv|xls|xlsx|xlsm|vnd.ms-excel|excel|x-excel|x-msexcel|vnd.openxmlformats-officedocument.spreadsheetml.sheet|octet-stream|pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|plain|doc|docx|ppt|pptx|vnd.ms-powerpoint|vnd.openxmlformats-officedocument.presentationml.presentation/";

// // module.exports = { upload: upload };

// module.exports = function (req, res, next) {
//   const imageStorage = multer.diskStorage({
//     destination: "uploads",
//     filename: (req, file, cb) => {
//       cb(null, file.fieldname + "_#" + Date.now() + extname(file.originalname));
//       // file.fieldname is name of the field (image)
//       // path.extname get the uploaded file extension
//     },
//   });

//   const upload = multer({
//     storage: imageStorage,
//     limits: {
//       fileSize: 4000000, // 2000000 Bytes = 4 MB
//     },
//     fileFilter(req, file, cb) {
//       if (!file.originalname.match(ALLOW_FILE_TYPE)) {
//         return cb(new Error("File Format Not Allowed"));
//       }
//       cb(undefined, true);
//     },
//   });
//   // upload.single("/abc");
//   console.log(req.files);

//   console.log(Object.keys(req));

//   next();
// };
