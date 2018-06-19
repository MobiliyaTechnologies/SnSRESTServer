var retentionPricingController = require('../controller/retentionPricingController');

module.exports = function (app) {
    app.get('/retention/price', retentionPricingController.getPricing);
};