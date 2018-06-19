var mongoose = require('mongoose');

const baseOptions = {
    discriminatorKey: '__type',
    collection: 'snsdata'
}

const Base = mongoose.model('Base', new mongoose.Schema({}, baseOptions));


module.exports.Base = Base;