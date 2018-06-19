var aggregatorController = require('../controller/aggregatorController');

module.exports = function (app) {
    app.post('/devices/aggregators', aggregatorController.registerAggregator);
    app.post('/aggregators', aggregatorController.manualAggregator);
    app.put('/aggregators/:id', aggregatorController.updateAggregator);
    app.get('/aggregators', aggregatorController.getAllAggregators);
    app.get('/aggregators/:id', aggregatorController.getAggregatorById);
    app.delete('/aggregators/:id', aggregatorController.removeAggregator);
};