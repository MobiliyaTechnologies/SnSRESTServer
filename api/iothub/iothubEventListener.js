var CronJob = require('cron').CronJob;
var { EventHubClient , EventPosition } = require('azure-event-hubs');
var constants = require('../config/constants');
var resultController = require('../controller/resultController');
var logger = require('../logger/index').logger;
var logStr = 'IouHubEventListener';

const client = EventHubClient.createFromConnectionString(constants.iotHubConfig.eventHubConnectionString, constants.iotHubConfig.eventHubName);

const onError = (err) => {
    logger.debug("%s : Error occured on IotHub listener", logStr);
};

const onMessage = (eventData) => {
    logger.debug("%s : Result data : " + eventData.body, logStr);
    resultController.sendResults(eventData);
}

var receiveHandlerArray = [];
client.getPartitionIds()
    .then(partitionIds => partitionIds.map(partitionId => {
        receiveHandler = client.receive(partitionId, onMessage, onError, { eventPosition: EventPosition.fromEnqueuedTime(Date.now()) })
        receiveHandlerArray.push(receiveHandler);
    }
    ));

var job = new CronJob('0 0 */8 * * *', function () {
    logger.debug("%s : IotHub event listener cron job executed", logStr);
    receiveHandlerArray.forEach(function (receiveHandler, index) {
        receiveHandler.stop();
        if (index === receiveHandlerArray.length - 1) {
            receiveHandlerArray = [];
            client._context.receivers = {};
            client.getPartitionIds()
                .then(partitionIds => partitionIds.map(partitionId => {
                    receiveHandler = client.receive(partitionId, onMessage, onError, { eventPosition: EventPosition.fromEnqueuedTime(Date.now()) })
                    receiveHandlerArray.push(receiveHandler);
                }
                ));
        }
    });
}, function () { }, true);