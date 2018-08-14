var textRecognition = require('../models/textRecognitionModel');
var constants = require('../config/constants');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var logger = require('../logger/index').logger;
var logStr = 'TextRecognitionDao';

/**
 * Save result of image to database 
 * @param {object} textData 
 */
var addTextRecognitionDetails = function (textData) {
    logger.debug("%s : In addTextRecognitionDetails function", logStr);
    textRecognition.create(textData, function (error, result) {
        if (error) {
            logger.error("%s : Error in addTextRecognitionDetails function : ", logStr, error);
            return;
        }
        logger.debug("%s : Sending Success response of addTextRecognitionDetails function.", logStr);
    });
};

exports.addTextRecognitionDetails = addTextRecognitionDetails;
