var _ = require('lodash');

module.exports = {
    create : createPathRewriter
}

/**
 * Create rewrite function, to cache parsed rewrite rules.
 */
function createPathRewriter (config) {

    if (config === undefined || config === null) {
        return;
    }

    var rules = parsePathRewriteRules(config);

    return rewritePath;

    function rewritePath (path) {
        var result = path;

        _.forEach(rules,function (rule) {
            if (rule.regex.test(path)) {
                result = result.replace(rule.regex, rule.value);
                return false;
            }
        });

        return result;
    }
}

function parsePathRewriteRules (config) {
    var rules = [];

    if (_.isPlainObject(config) === false) {
        throw new Error('[HPM] Invalid pathRewrite config. Expecting an object literal with pathRewrite configuration');
    } else {

        _.forIn(config, function (value, key) {
            rules.push({
                regex : new RegExp(key),
                value : config[key]
            });
            console.log('[HPM] Proxy rewrite rule created: "' + key + '" -> "' + config[key] + '"');
        });

    }

    return rules;
}

