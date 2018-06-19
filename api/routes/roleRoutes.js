var roleController = require('../controller/roleController');

module.exports = function (app) {
    app.put('/roles/:id', roleController.updateRole);
    app.get('/roles', roleController.getAllRoles);
};