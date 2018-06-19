var powerbiController = require('../controller/powerbiController');

module.exports = function (app) {
    app.get('/powerbi/auth', powerbiController.getAccessToken);
    app.post('/powerbi',powerbiController.saveConfigurtaion);
};