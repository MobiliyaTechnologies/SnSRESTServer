var constants = require('../config/constants');

var errors = {
    Runtime: { json: { message: "Internal Server Error" }, status: constants.httpStatusCodes.internalError },
    PageNotFound: { json: { message: "Page Not Found" }, status: constants.httpStatusCodes.notFound },
    BadRequest: { json: { message: "Bad Content" }, status: constants.httpStatusCodes.badRequest },
    UnAuthorizedError: { json: { message: "unAuthorized user" }, status: constants.httpStatusCodes.unAuthorized },
    CameraNotFoundError: { json: { message: "Camera not found" }, status: constants.httpStatusCodes.notFound },
    VideoNotFoundError: { json: { message: "Video with given id not found" }, status: constants.httpStatusCodes.notFound },
    VideoRetentionNotFoundError: { json: { message: "Video retention details with given id not found" }, status: constants.httpStatusCodes.notFound },
    FaceNotFoundError: { json: { message: "Face not found" }, status: constants.httpStatusCodes.notFound },
    ComputeEngineNotFoundError: { json: { message: "Compute engine not found" }, status: constants.httpStatusCodes.notFound },
    AggregatorNotFoundError: { json: { message: "Aggregator not found" }, status: constants.httpStatusCodes.notFound },
    InvalidFeatureError: { json: { message: "Invalid feature name" }, status: constants.httpStatusCodes.unprocessableEntity },
    UnprocessableEntity: { json: { message: "Unprocessable Entity" }, status: constants.httpStatusCodes.unprocessableEntity },
    DuplicateDataError: { json: { message: "Record already exist with given details" }, status: constants.httpStatusCodes.conflict },
    ForbiddenError: { json: { message: "You are not authorized to access this resource" }, status: constants.httpStatusCodes.forbidden },
    AggregatorExistsError: { json: { message: "Aggregator with given macId already exists" }, status: constants.httpStatusCodes.conflict },
    PowerbiConfNotFoundError: { json: { message: "Powerbi Configuration not found" }, status: constants.httpStatusCodes.notFound },
};

var errorHandler = function (errorName, response) {
    response.setHeader('content-type', 'application/problem+json;charset=utf-8');
    if (errorName.name === constants.mongodbValidationError) {
        response.status(constants.httpStatusCodes.unprocessableEntity).send({ message: errorName.message });
        return;
    }
    if(errorName.code === constants.mongodbDuplicateDataError){
        response.status(constants.httpStatusCodes.conflict).send({ message: errors['DuplicateDataError'].json.message});
        return;
    }
    if (errors[errorName]) {
        response.status(errors[errorName].status).send(errors[errorName].json);
        return;
    }
    
    var errResponse = errors["Runtime"].json;
    if (errorName.message) {
        errResponse.message = errorName.message;
    } else if (errorName) {
        errResponse.message = errorName;
    }

    response.status(constants.httpStatusCodes.internalError).send(errResponse);
};

exports.errorHandler = errorHandler;