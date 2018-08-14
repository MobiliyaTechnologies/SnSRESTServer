var express = require('express');
var app = express();
var mongoose = require('mongoose');
var cors = require('cors');
var bodyParser = require('body-parser');
var http = require('http');
var server = http.createServer(app);
var fs = require('fs');
var passport = require('passport');
var BearerStrategy = require('passport-azure-ad').BearerStrategy;
var constants = require('./api/config/constants');
var config = require('./settings');
var index = require('./api/models/index');
var resultDao = require('./api/dao/resultDao');
var roleController = require('./api/controller/roleController');
var roleDao = require('./api/dao/roleDao');
var computeEngineDao = require('./api/dao/computeEngineDao');
var errorHandler = require('./api/errorHandler/errorHandler').errorHandler;
var logger = require('./api/logger/index').logger;
var logStr = 'App';
var imageMap = new Map();
var resultMap = new Map();
var mobileCamMap = new Map();
var streamingReqMap = new Map();
var liveCameraResultMap = new Map();
var onStart = true;
var totalResultMap = new Map();
var triplineCamMap = new Map();
var userIdentifiedMap = new Map();
var isUserExist = true;
var facePricingTier = 0;

var port = config.port;
if(process.env && process.env.PORT){
    port = process.env.PORT
}

/** CORS middleware */
var options = {
    inflate: true,
    limit: '100kb',
    type: 'text'
};

/** B2c configuration */
var b2cOptions = {
    identityMetadata: constants.b2cConfig.url + constants.b2cConfig.tenantID + constants.b2cConfig.identityMetadata,
    clientID: constants.b2cConfig.clientID,
    policyName: constants.b2cConfig.policyName,
    isB2C: true,
    validateIssuer: true,
    loggingLevel: constants.b2cConfig.loggingLevel,
    passReqToCallback: false
};

var bearerStrategy = new BearerStrategy(b2cOptions, function (token, done) {
    done(null, {}, token);
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.raw(options));
app.use(cors());

app.use(passport.initialize());
passport.use(bearerStrategy);

/**Check if user is registered or not in database */
roleDao.getUserCount(function (error, result) {
    if (error) {
        logger.error("%s: Error in getUserCount function", logStr, error);
        isUserExist = true;
    }
    if (result === 0) {
        logger.error("%s: No user Registered ", logStr);
        isUserExist = false;
    }
    else{
        isUserExist = true;
    }
    exports.isUserExist = isUserExist;
});


/** Get face recognition pricing tier*/
computeEngineDao.getFaceComputeEngine(function(error, result){
    if(error){
        logger.error("%s: Error in getFaceComputeEngine function", logStr, error);
        facePricingTier = 0;
    }
    else if(result.length === 0){
        facePricingTier = 0;
    }
    else{
        facePricingTier = result[0].tier;
    }
    exports.facePricingTier = facePricingTier;
});

exports.server = server;
exports.mobileCamMap = mobileCamMap;
exports.imageMap = imageMap;
exports.resultMap = resultMap;
exports.streamingReqMap = streamingReqMap;
exports.liveCameraResultMap = liveCameraResultMap;
exports.totalResultMap = totalResultMap;
exports.triplineCamMap = triplineCamMap;
exports.userIdentifiedMap = userIdentifiedMap;

var socketIo = require('./api/socket/socket');
var iotHubClient = require('./api/iothub/iotHubClient');
var iotHubEventListener = require('./api/iothub/iothubEventListener');

/** Cron jobs */
var removeDevice = require('./api/jobs/removeDevice');
var removeExpiredVideos = require('./api/jobs/removeExpiredVideos');
var removeReadNotifications = require('./api/jobs/removeNotifications');
var removeResults = require('./api/jobs/removeResults');

/** Test route */
app.get('/_ping', function (req, res) {
    res.status(constants.httpStatusCodes.success).send('PONG');
});

/**Return emailId and role of user to the client */
app.get('/users', passport.authenticate('oauth-bearer', { session: false }), function (req, res, next) {
    var claims = req.authInfo;
    req.body.emailId = claims.emails[0];
    req.body.firstName = claims.name;
    req.body.lastName = claims.family_name;
    roleController.createRole(req, res);
});

var validPathForAuthorization = constants.pathsForAuthorization;
/** validate if user is authorized to access th API or not */
app.all(validPathForAuthorization, passport.authenticate('oauth-bearer', { session: false }), function (req, res, next) {
    var claims = req.authInfo;
    req.headers.userid = claims.emails[0];
    roleController.getRoleDetails(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        var role = result.role;
        var originalUrl = req.originalUrl;
        if (role === constants.roles.superAdmin) {
            next();
        }
        else if (role === constants.roles.admin) {
            var superAdminAccessUrls = constants.superAdminAccessUrls;
            var keys = Object.keys(superAdminAccessUrls);
            var isMatch = false;
            keys.forEach(function (key, index) {
                if (!isMatch) {
                    if (originalUrl.startsWith(key) && superAdminAccessUrls[key].indexOf(req.method) > -1) {
                        isMatch = true;
                        errorHandler('ForbiddenError', res);
                        return;
                    }
                    else if (index === keys.length - 1) {
                        next();
                    }
                }
            });
        }
        else {
            var userAccessUrls = constants.userAccessUrls;
            var originalUrl = req.originalUrl;
            var keys = Object.keys(userAccessUrls);
            var isMatch = false;
            keys.forEach(function (key, index) {
                if (!isMatch) {
                    if (originalUrl.startsWith(key) && userAccessUrls[key].indexOf(req.method) > -1) {
                        isMatch = true;
                        next();
                    }
                    else if (index === keys.length - 1) {
                        errorHandler('ForbiddenError', res);
                        return;
                    }
                }
            });
        }
    });
});

if (onStart) {
    onStart = false;
    resultDao.getLatestResult(function (error, result) {
        if (error) {
            logger.error("%s: Error in getLatestResult function", logStr, error);
            return;
        }
        if (result) {
        result.forEach(function(camera, index){
            if(!camera.totalCount){
                camera.totalCount = 0;
            }
            var counts = {
                'previousCount': camera.previousCount,
                'totalCount': camera.totalCount
            }
            totalResultMap.set(camera._id, counts);
        });
    }
    });
}

/** API routes */
var resultRoutes = require('./api/routes/resultRoutes');
var computeEngineRoutes = require('./api/routes/computeEngineRoutes');
var aggregatorRoutes = require('./api/routes/aggregatorRoutes');
var cameraRoutes = require('./api/routes/cameraRoutes');
var roleRoutes = require('./api/routes/roleRoutes');
var loggerRoutes = require('./api/routes/loggerRoutes');
var cameraProfileRoutes = require('./api/routes/cameraProfileRoutes');
var floorMapRoutes = require('./api/routes/floorMapRoutes');
var faceRecognitionRoutes = require('./api/routes/faceRecognitionRoutes');
var notificationRoutes = require('./api/routes/notificationRoutes');
var videoIndexingRoutes = require('./api/routes/videoIndexingRoutes');
var powerBiRoutes = require('./api/routes/powerbiRoutes');
var videoRetentionRoutes = require('./api/routes/videoRetentionRoutes');
var userHistoryRoutes = require('./api/routes/userHistoryRoutes');
var retentionPricingRoutes = require('./api/routes/retentionPricingRoutes');

resultRoutes(app);
computeEngineRoutes(app);
aggregatorRoutes(app);
cameraRoutes(app);
roleRoutes(app);
loggerRoutes(app);
cameraProfileRoutes(app);
floorMapRoutes(app);
faceRecognitionRoutes(app);
notificationRoutes(app);
videoIndexingRoutes(app);
powerBiRoutes(app);
videoRetentionRoutes(app);
userHistoryRoutes(app);
retentionPricingRoutes(app);

/** Start http server */
server.listen(port);

/** Static folder to save floor map images */
app.use(express.static('public'))

/** handle invalid url requets */
app.use(function (req, res, next) {
    if (req.method === 'OPTIONS')
        next();
    else {
        logger.error("%s : Path not found : " + req.originalUrl, logStr);
        errorHandler('PageNotFound', res);
    }
});