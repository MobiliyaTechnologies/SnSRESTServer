var logger = require('../logger/index').logger;
var logStr = 'IotHubErrorHandler';

function sendMessageCallback(op) {
    return function printResult(error, result) {
        if (error){
            logger.error("%s : Error while request to device ", logStr, error);
            return;
        }
        logger.debug("%s : Request sent to device"+ result.constructor.name, logStr);
    };
}

exports.sendMessageCallback = sendMessageCallback;