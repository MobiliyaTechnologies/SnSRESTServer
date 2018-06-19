var image = require('../models/imageModel');
var logger = require('../logger/index').logger;
var logStr = 'ImageDao';

/**
 * Save image details to database 
 * @param {object} imageData
 */
var addImage = function (imageData) {
    logger.debug("%s : In addImage function", logStr);
    image.create(imageData, function (error, result) {
        if (error) {
            logger.error("%s : Error in addImage function : ", logStr, error);
            return;
        }
        logger.debug("%s : Sending Success response of addImage function.", logStr);
    });
};

exports.addImage = addImage;