var CronJob = require('cron').CronJob;
var resultDao = require('../dao/resultDao');
var constants = require('../config/constants');
var logger = require('../logger/index').logger;
var logStr = 'removeResultsCron';

var job = new CronJob('0 0 */3 * * *', function () {
    logger.debug("%s : Remove results cron job executed", logStr);
    removeResults();
}, function () { }, true);

var removeResults = function(){
    resultDao.removeOldResults(function(error, result){
        if(error){
            logger.error("%s : Error while removing result data", logStr, error);
            return;
        }
        logger.debug("%s : Result data removed successfully", logStr);
    });
}
