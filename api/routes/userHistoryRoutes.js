var userHistoryController = require('../controller/userHistoryController');

module.exports = function (app) {
    app.get('/users/history', userHistoryController.getUserHistory);
    app.get('/users/history/count', userHistoryController.getCountOfUserHistory);
}