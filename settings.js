var config = {
    "hostname": process.env.CUSTOMCONNSTR_backendHost,
    "port": 5009,
    "host": "localhost",
    "mongoose": {
        "url": process.env.CUSTOMCONNSTR_mongooseUrl,
        "poolSize": 50,
        "options": {
            "useMongoClient": true,
			"autoReconnect": true,
            "reconnectTries": Number.MAX_VALUE,
            "reconnectInterval": 500,
            "poolSize": 50
        }
    },
    "logger": {
        "service": "SS",
        "logDirPath": "./logs",
        "debugLevel": 3,
        "infoLevel": 2,
        "warnLevel": 1,
        "errorLevel": 0,
        "maxSize": 5242880
    }
};

module.exports = config;