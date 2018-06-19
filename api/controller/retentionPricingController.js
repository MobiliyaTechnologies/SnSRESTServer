var retentionPricingDao = require('../dao/retentionPricingDao');

var getPricing = function (req, res) {
    retentionPricingDao.getPricing(req, res);
}

exports.getPricing = getPricing;
