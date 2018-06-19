var computeEngineController = require('../controller/computeEngineController');

module.exports = function (app) {
    app.post('/devices/computeengines', computeEngineController.registerComputeEngine);
    app.post('/devices/computeengines/algorithm',computeEngineController.registerAlgorithm);
    app.delete('/devices/computeengines/algorithm/:id',computeEngineController.unregisterAlgorithm);
    app.post('/computeengines', computeEngineController.manualComputeEngine);
    app.put('/computeengines/:id', computeEngineController.updateComputeEngine);
    app.get('/computeengines', computeEngineController.getAllComputeEngines);
    app.get('/computeengines/:id', computeEngineController.getComputeEngineById);
    app.put('/computeengines/algorithm/:id',computeEngineController.updateAlgoStatus);
    app.get('/analytics/computeengines/features', computeEngineController.getFeatureList);
    app.delete('/computeengines/:id',computeEngineController.removeComputeEngine);
};