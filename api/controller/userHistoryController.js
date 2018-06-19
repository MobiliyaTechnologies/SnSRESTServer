var userHistoryDao = require('../dao/userHistoryDao');

var getUserHistory = function (req, callback) {
    userHistoryDao.getUserHistory(req, callback);
}

var getCountOfUserHistory = function(req, res){
    userHistoryDao.getCountOfUserHistory(req, res);
}

exports.getUserHistory = getUserHistory;
exports.getCountOfUserHistory = getCountOfUserHistory;