const todosModel = require('./Model');
const config = require('../../config/config');
const common = require('../../lib/common');

module.exports = {
    todosOperations: todosOperations,
    viewTodos: viewTodos,
    todosCategoryOperations: todosCategoryOperations,
    todosCategoryView: todosCategoryView

}


    function todosCategoryOperations(req, res, next) {
        if (!req.body.createdby) {
            res.status(400);
            return res.json({ "state": -1, "message": "Invalid Session" })
        }
        else {
            var data = {
                "type": req.body.action,
                "category_name": req.body.category_name,
                "category_id": req.body.category_id,
                "createdby": req.body.createdby
            }
            //Call the procedure to insert data into database
            todosModel.todosCategorySPCall(JSON.stringify(data), function (err, result) {
                if (err) {
                    return res.json({ "state": -1, "message": err });
                }
                else {
                    var clientdata = result[0];
                    if (clientdata.length == 1) {
                        return res.json({
                            "state": clientdata[0].state, "message": clientdata[0].message,
                            "data": clientdata[0].category_id
                        });
                    }

                }
            });
        }
    }


    function todosCategoryView(req, res, next) {
        var data = {
            "type": req.body.action,
            "createdby": req.body.createdby,
            "category_id": req.body.category_id
        }
        //Call the procedure to insert data into database
        todosModel.todosCategorySPCall(JSON.stringify(data), function (err, result) {
            if (err) {
                return res.json({ "state": -1, "message": err });
            }
            else {
                var clientdata = result[1];
                if (clientdata.length == 1) {
                    return res.json({ "state": clientdata[0].state, "message": clientdata[0].message, data: result[0] });
                }

            }
    });
    }


    function todosOperations(req, res, next) {

        if (!req.body.createdby) {
            res.status(400);
            return res.json({ "state": -1, "message": "Send required data" })
        }
        else {
            var data = {
                "type": req.body.action,
                "task_title": req.body.task_title,
                "task_description": req.body.task_description,
                "createdby": req.body.createdby,
                "category_id": req.body.category_id,
                "id": req.body.id,
                "iscomplete": req.body && req.body.iscomplete
            }

            //Call the procedure to insert data into database
            todosModel.todosSPCall(JSON.stringify(data), function (err, result) {
                if (err) {
                    return res.json({ "state": -1, "message": err });
                }
                else {
                    var clientdata = result[0];
                    if (clientdata.length == 1) {
                        return res.json({ "state": clientdata[0].state, "message": clientdata[0].message });
                    }

                }
            });
        }
    }


    function viewTodos(req, res, next) {
        var data = {
            "type": req.body.action,
            "createdby": req.body.createdby,
            "category_id": req.body.category_id
        }
        //Call the procedure to insert data into database
        todosModel.todosSPCall(JSON.stringify(data), function (err, result) {
            if (err) {
                return res.json({ "state": -1, "message": err });
            }
            else {
                var clientdata = result[1];
                // console.log("tododsssssssss", result[0]);

                if (clientdata.length == 1) {
                    return res.json({ "state": clientdata[0].state, "message": clientdata[0].message, data: result[0] });
                }
                else {
                    return res.json({ "state": -1, "message": "Something went wrong" });
                }
            }
        });

    }