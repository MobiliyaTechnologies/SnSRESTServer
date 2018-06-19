var role = require('../models/roleModel');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var logger = require('../logger/index').logger;
var logStr = 'RoleDao';

/**
 * This function will add default role User for given emailId
 * @param {object} req Request contains emailId of the user
 * @param {object} res 
 */
var createRole = function (req, res) {
    logger.debug("%s : In createRole function. Received emailId: " + req.body.emailId, logStr);
    role.findOneAndUpdate({ emailId: req.body.emailId }, { $setOnInsert: req.body }, { upsert: true, new: true }, function (error, result) {
        if (error) {
            logger.error("%s : Error in createRole function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of createRole function.", logStr);
        res.status(constants.httpStatusCodes.success).send({ 'email': req.body.emailId, 'role': result.role });
    });
};

/**
 * This function will update the role of the existing user
 * @param {object} req Request contains emailId of the user, for which admin want to update the role
 * @param {object} res 
 */
var updateRole = function (req, res) {
    logger.debug("%s : In updateRole function. Received emailId: " + req.params.id, logStr);
    role.findOneAndUpdate({ _id: req.params.id }, { $set: { role: req.body.role } }, { upsert: true, new: true }, function (error, result) {
        if (error) {
            logger.error("%s : Error in updateRole function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of updateRole function.", logStr);
        res.status(constants.httpStatusCodes.success).send(result);
    });
};

/**
 * This function will return role details by user emailId
 * @param {object} req Request contains emailId of the user
 * @param {object} res Response will return user role details
 */
var getRoleDetails = function (req, callback) {
    logger.debug("%s : In getRoleDetails function. Received emailId: " + req.headers.userid, logStr);
    role.findOne({ emailId: req.headers.userid }, function (error, result) {
        if (error) {
            logger.error("%s : Error in getRoleDetails function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of getRoleDetails function.", logStr);
            callback(null, result);
        }
    });
};

/**
 * This function will return list of users with role Admin and User
 * @param {object} req 
 * @param {object} res 
 */
var getAllRoles = function (req, res) {
    logger.debug("%s : In getAllRoles function. Received emailId: " + req.headers.id, logStr);
    role.find({ role: { $in: [constants.roles.admin, constants.roles.user] } }, function (error, result) {
        if (error) {
            logger.error("%s : Error in getAllRoles function : ", logStr, error);
            errorHandler(error, res);
        }
        logger.debug("%s : Sending Success response of getAllRoles function.", logStr);
        res.status(constants.httpStatusCodes.success).send(result);
    });
};

/**This function will return user role count */
var getUserCount = function(callback){
    logger.debug("%s : In getUserCount function. ", logStr);
    role.count({ }, function (error, result) {
        if (error) {
            logger.error("%s : Error in getUserCount function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of getUserCount function.", logStr);
            callback(null, result);
        }
    });
}

exports.createRole = createRole;
exports.updateRole = updateRole;
exports.getRoleDetails = getRoleDetails;
exports.getAllRoles = getAllRoles;
exports.getUserCount = getUserCount;