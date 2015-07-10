var url = require('url');
var utilContextMatch = require('./util-context-match');

module.exports = {
    matchContext     : matchContext,
    createPathRewriter : createPathRewriter
}

function matchContext (context, uri) {
    // single path
    if (typeof context === 'string') {
        return utilContextMatch.matchSinglePath(context, uri);
    }
    // multi path
    if (Array.isArray(context)) {
        return utilContextMatch.matchMultiPath(context, uri);
    }

    throw new Error('[HPM] Invalid context. Expecting something like: "/api" or ["/api", "/ajax"]');
}

/**
 * Create rewrite function, to cache parsed rewrite rules.
 */
function createPathRewriter (config) {
    var rules = parsePathRewriteRules(config);

    return rewritePath;

    function rewritePath (path) {
        var result = path;

        rules.forEach(function (rule) {
            if (rule.regex.test(path)) {
                result = result.replace(rule.regex, rule.value);
            }
        });

        return result;
    }
}

function parsePathRewriteRules (config) {
    var rules = [];

    if (isObject(config) === false) {
        throw new Error('[HPM] Invalid pathRewrite config. Expecting an object literal with pathRewrite configuration');
    }

    for (var key in config) {
        if (config.hasOwnProperty(key)) {
            rules.push({
                regex : new RegExp(key),
                value : config[key]
            });

            console.log('[HPM] Proxy rewrite rule created: "' + key + '" -> "' + config[key] + '"');
        }
    }

    return rules;
}

function isObject (val) {
    return Object.prototype.toString.call(val) === '[object Object]' && typeof val === 'object';
}
