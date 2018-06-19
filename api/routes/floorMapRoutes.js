var floorMapController = require('../controller/floorMapController');

module.exports = function (app) {
    app.post('/maps', floorMapController.createFloorMap);
    app.put('/maps/:id', floorMapController.updateFloorMap);
    app.get('/maps', floorMapController.getFloorMap);
    app.delete('/maps/:id', floorMapController.deleteMap);
};