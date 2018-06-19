var notificationeDao = require('../dao/notificationDao');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var io = require('../socket/socket').socketIo;

var createNotification = function (req, type) {
    notificationeDao.createNotification(req, function (error, result) {
        if (error) {
            return;
        }
        
        io.emit('notification', {
                'message': req.message,
                'type': type
        });
    });
}

var getNotification = function (req, res) {
    notificationeDao.getNotification(req, res);
}

exports.createNotification = createNotification;
exports.getNotification = getNotification;