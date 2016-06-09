var _      = require('lodash');
var logger = require('./logger.js').getInstance();

module.exports = {
    createProxyOptions: createProxyOptions
};

function createProxyOptions(req, config) {
    var router = config.router;
    var result = _.clone(config);

    if (router) {
        var newTarget = getTargetFromProxyTable(req, router);
        if (newTarget) {
            logger.debug('[HPM] router new target: %s -> "%s"', config.target, newTarget);
            result = _.assign(result, {target: newTarget});    // override option.target
        }
    }

    return result;
}

function getTargetFromProxyTable(req, router) {
    var result;
    var host = req.headers.host;
    var path = req.url;

    var hostAndPath = host + path;

    _.forIn(router, function(value, key) {
        if (containsPath(key)) {

            if (hostAndPath.indexOf(key) > -1) {    // match 'localhost:3000/api'
                result = router[key];
                logger.debug('[HPM] router match: %s -> "%s"', hostAndPath, result);
                return false;
            }
        } else {

            if (key === host) {                     // match 'localhost:3000'
                result = router[key];
                logger.debug('[HPM] router match: %s -> "%s"', host, result);
                return false;
            }

        }

    });

    return result;
}

function containsPath(v) {
    return v.indexOf('/') > -1;
}
