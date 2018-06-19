
var retentionPricing = require('../models/retentionPricingModel');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var logger = require('../logger/index').logger;
var logStr = 'RetentionPricingDao';

/** Get video retention pricing */
var getPricing = function (req, res) {
    logger.debug("%s : In getPricing function", logStr);
    retentionPricing.findOne({}, function (error, result) {
        if (error) {
            logger.error("%s : Error in getPricing function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        if(result){
            res.status(constants.httpStatusCodes.success).send(result);
            return;
        }
        var response = {
            'price': constants.videoRetentionPrice
        }
        res.status(constants.httpStatusCodes.success).send(response);
    });
};

exports.getPricing = getPricing;