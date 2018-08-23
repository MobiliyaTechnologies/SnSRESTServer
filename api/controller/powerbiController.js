var request = require('request');
var constants = require('../config/constants');
var powerbiDao = require('../dao/powerbiDao');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;

var getAccessToken = function (req, res) {
    powerbiDao.getPowerBiDetails(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        if (!result) {
            errorHandler('PowerbiConfNotFoundError', res);
            return;
        }
        var authReq = {
            'grant_type': result.grant_type,
            'username': result.username,
            'password': result.password,
            'client_id': result.client_id,
            'client_secret': result.client_secret,
            'resource': result.resource
        }

        request.post({
            headers: { 'content-type': result.contentTypeHeader },
            url: result.oauthUrl,
            form: authReq
        }, function (error, response, body) {
            if (error) {
                res.status(constants.httpStatusCodes.internalError).send(error);
                return;
            }
            if(response.statusCode !== constants.httpStatusCodes.success){
                res.status(response.statusCode).send({'message': 'Error while getting access token'});
                return;
            }
            var response = {};
            response.access_token = JSON.parse(body).access_token;
            response.embed_url = result.embed_url;
            response.dId = result.dId;
            response.client_id = result.client_id;
            response.client_secret = result.client_secret;
            response.username = result.username;
            response.confName = result.confName;
            res.status(constants.httpStatusCodes.success).send(response);
        });
    });
}

var saveConfigurtaion = function (req, res) {
    powerbiDao.savePowerBiDetails(req, res);
}

exports.getAccessToken = getAccessToken;
exports.saveConfigurtaion = saveConfigurtaion;
