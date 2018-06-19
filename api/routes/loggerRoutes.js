var loggerController = require('../controller/loggerController');

module.exports = function (app) {
    app.put('/logger', loggerController.updateLoggerLevel);
};