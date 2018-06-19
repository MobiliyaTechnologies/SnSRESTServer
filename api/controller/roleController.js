var roleDao = require('../dao/roleDao');
var constants = require('../config/constants');

var createRole = function (req, res) {
    var app = require('../../server');
    var isUserExist = app.isUserExist;
    req.body.role = 'User'
    if (!isUserExist) {
        req.body.role = 'SuperAdmin'
        app.isUserExist = true;
    }
    roleDao.createRole(req, res);
};

var updateRole = function (req, res) {
    if (req.body.role && (req.body.role === constants.roles.admin || req.body.role === constants.roles.user)) {
        roleDao.updateRole(req, res);
    }
    else {
        res.status(constants.httpStatusCodes.unprocessableEntity).send({ 'message': 'Please send valid user role' });
        return;
    }
}

var getRoleDetails = function (req, callback) {
    roleDao.getRoleDetails(req, callback);
}

var getAllRoles = function (req, res) {
    roleDao.getAllRoles(req, res);
}

var deleteUserRole = function (req, res) {
    roleDao.deleteUserRole(req, res);
}

var getUserCount = function(callback){
    roleDao.getUserCount(callback);
}
exports.createRole = createRole;
exports.updateRole = updateRole;
exports.getRoleDetails = getRoleDetails;
exports.getAllRoles = getAllRoles;
exports.getUserCount = getUserCount;