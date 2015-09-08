var url    = require('url');
var _      = require('lodash');
var logger = require('./logger.js').getInstance();

module.exports = {
    createProxyOptions : createProxyOptions
}

function createProxyOptions (req, config) {
    var proxyTable = config.proxyTable;
    var result = _.clone(config);

    if (proxyTable) {
        var newTarget = getTargetFromProxyTable(req, proxyTable);
        if (newTarget) {
            logger.debug('[HPM] proxyTable new target: %s -> "%s"', config.target, newTarget);
            result = _.assign(result, {target : newTarget});    // override option.target
        }
    }

    return result;
}

function getTargetFromProxyTable (req, proxyTable) {
    var result;
    var host = req.headers.host;
    var path = req.url;

    var hostAndPath = host + path;

    _.forIn(proxyTable, function (value, key) {
        if (containsPath(key)) {

            if (hostAndPath.indexOf(key) > -1) {    // match 'localhost:3000/api'
                result = proxyTable[key];
                logger.debug('[HPM] proxyTable match: %s -> "%s"', hostAndPath, result);
                return false;
            }
        } else {

            if (key === host) {                     // match 'localhost:3000'
                result = proxyTable[key];
                logger.debug('[HPM] proxyTable match: %s -> "%s"', host, result);
                return false;
            }

        }

    });

    return result;
}

function containsPath (v) {
    return v.indexOf('/') > -1;
}
