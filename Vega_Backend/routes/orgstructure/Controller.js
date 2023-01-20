// "use strict";
// const query = require("../common/Model").mysqlPromiseModelService;
// const lazyLoading = require("../common/Controller").lazyLoading;


// module.exports = {
//   orgstructure: async (req, res) => {
//     try {
//       if (!req.body.createdby)
//         throw new Error('Not a valid user!');
//       const reqData = JSON.stringify(req.body);
//       const [results] = await query('call usp_trxorgstructure(?)', [reqData]);
//       console.log("commonCtrl", lazyLoading);
//       const lazydata = commonCtrl.lazyLoading(results,req.body);
//       return res.json({
//         state: 1,
//         message: "success",
//         data: lazydata.data,
//         count : lazydata.count
//       });
//     } catch (err) {
//       console.log('Error!',err);
//       return res.json({
//         state: -1,
//         message: err.message || err
//       });
//     }
//   }
// }
