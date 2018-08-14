var CronJob = require('cron').CronJob;
var notificationDao = require('../dao/notificationDao');
var constants = require('../config/constants');
var logger = require('../logger/index').logger;
var logStr = 'removeNotificationCron';

var job = new CronJob('00 00 00 * * *', function () {
    logger.debug("%s : Remove notifications cron job executed", logStr);
    removeReadNotifications();
}, function () { }, true);

var removeReadNotifications = function(){
    notificationDao.removeReadNotifications(function(error, result){
        if(error){
            logger.error("%s : Error while removing notification", logStr, error);
            return;
        }
        logger.debug("%s : Notifications removed successfully", logStr);
    })
}
