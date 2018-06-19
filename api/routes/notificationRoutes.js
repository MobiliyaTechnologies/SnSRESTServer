var notificationController = require('../controller/notificationController');

module.exports = function (app) {
    app.get('/notifications', notificationController.getNotification);
};