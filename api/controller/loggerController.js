var config = require('../../settings');
var logger = require('../logger/index').logger;
var constants = require('../config/constants');

var updateLoggerLevel = function (req, res) {
    if (req.body.logLevel === undefined || req.body.logLevel < 0 || req.body.logLevel > config.logger.infoLevel || typeof (req.body.logLevel) !== "number") {
        errorHandler('BadRequest', res);
        return;
    }
    try {
        var configParams = req.body;
        logger.config({
            service: config.logger.service,
            level: configParams.logLevel
        });
        res.status(constants.httpStatusCodes.success).send({ message: 'success' });
    } catch (err) {
        errorHandler('Runtime', res);
    }
}

exports.updateLoggerLevel = updateLoggerLevel;