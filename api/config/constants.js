var config = {
    "httpStatusCodes": {
        "success": 200,
        "resourceCreated": 201,
        "requestAccepted": 202,
        "noContent": 204,
        "badRequest": 400,
        "unAuthorized": 401,
        "forbidden": 403,
        "notFound": 404,
        "conflict": 409,
        "unprocessableEntity": 422,
        "tooManyRequests": 429,
        "internalError": 500,
        "serviceUnavailable": 503
    },
    "mongodbValidationError": "ValidationError",
    "mongodbDuplicateDataError": 11000,
    "b2cConfig": {
        "url": "https://login.microsoftonline.com/",
        "clientID": process.env.CUSTOMCONNSTR_b2cClientID,
        "policyName": process.env.CUSTOMCONNSTR_b2cPolicyName,
        "tenantID": process.env.CUSTOMCONNSTR_b2cTenantID,
        "loggingLevel": "error",
        "identityMetadata": "/v2.0/.well-known/openid-configuration/"
    },
    "pathsForAuthorization": ['/aggregators', '/aggregators/*', '/computeengines', '/computeengines/*', '/logger', '/roles', '/roles/*',
    '/cameras', '/cameras/*','/profiles/cameras', '/maps','/faces', '/faces/*', '/analytics/*', '/videos', '/videos/*',
    '/notifications','/powerbi', '/powerbi/*', '/users', '/users/*', '/retention', '/retention/*'],
    "roles": {
        "superAdmin": "SuperAdmin",
        "admin": "Admin",
        "user": "User"
    },
    "superAdminAccessUrls": {
        "/roles": ["PUT"],
        "/roles": ["GET"]
    },
    "userAccessUrls": {
        "/cameras": ["GET"],
        "/profiles/cameras": ["GET"],
        "/users": ["GET"],
        "/analytics": ["GET", "POST"],
        "/maps": ["GET"]
    },
    "imageDirectory": "./Cameras",
    "faceApiConfig": {
        "standardFaceApiBaseUrl": process.env.CUSTOMCONNSTR_standardFaceApiBaseUrl + "facelists/0/persistedFaces",
        "standardFaceApiSubscriptionKey": process.env.CUSTOMCONNSTR_standardFaceApiSubscriptionKey,
        "freeFaceApiBaseUrl": process.env.CUSTOMCONNSTR_freeFaceApiBaseUrl + "facelists/0/persistedFaces",
        "freeFaceApiSubscriptionKey": process.env.CUSTOMCONNSTR_freeFaceApiSubscriptionKey,
        "faceApiContentTypeHeader": "application/json",
        "faceApiMethodType": "POST",
        "removeFaceAPIMethodType": "DELETE"
    },
    "mobileImageType": "Mobile",
    "mobile360ImageType": "Mobile360",
    "cronJobInterval" : 960000,
    "cronJobIntervalMinutes": 16,
    "userNotificationTimeHr": 1,
    "videoIndexer": {
        "ocpSubscriptionKey": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "mediaWidgetUrl": "https://videobreakdown.azure-api.net/Breakdowns/Api/Partner/Breakdowns/$id/PlayerWidgetUrl",
        "insightsWidgetUrl": "https://videobreakdown.azure-api.net/Breakdowns/Api/Partner/Breakdowns/$id/InsightsWidgetUrl?allowEdit=true"
    },
    "iotHubConfig": {
        "connectionString": process.env.CUSTOMCONNSTR_iothubConnectionString,
        "eventHubConnectionString": process.env.CUSTOMCONNSTR_eventHubConnectionString,
        "eventHubName": process.env.CUSTOMCONNSTR_eventHubName
    },
    "blobStorage": {
        "blobUri": process.env.CUSTOMCONNSTR_blobUri,
        "blobContainerName": 'facerecognition',
        "blobStorageAccessKey": process.env.CUSTOMCONNSTR_blobStorageAccessKey,
        "blobStorageAccountName": process.env.CUSTOMCONNSTR_blobStorageAccountName
    },
    "videoBlobStorage": {
        "blobUri": process.env.CUSTOMCONNSTR_videoBlobUri,
        "blobContainerName": 'videoindexer',
        "blobStorageAccessKey": process.env.CUSTOMCONNSTR_videoBlobStorageAccessKey,
        "blobStorageAccountName": process.env.CUSTOMCONNSTR_videoBlobStorageAccountName
    },
    "floorMapImagePath": "./public/",
    "videoRetentionPrice": 0.030
}
module.exports = config;
