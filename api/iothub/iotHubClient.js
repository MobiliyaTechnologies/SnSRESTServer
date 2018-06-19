var Client = require('azure-iothub').Client;
var io = require('../socket/socket').socketIo;
var constants = require('../config/constants');
var io = require('../socket/socket').socketIo;
var logger = require('../logger/index').logger;
var logStr = 'IotHub';

var iotHubClient = Client.fromConnectionString(constants.iotHubConfig.connectionString);

exports.iotHubClient = iotHubClient;

iotHubClient.open(function (error) {
    if (error) {
        logger.error("%s : Topic not handled", logStr, error);
        return;
    }
    logger.debug("%s : Iot Hub Client connected", logStr);
});