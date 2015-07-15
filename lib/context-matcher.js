var url = require('url');
var isGlob = require('is-glob');
var micromatch = require('micromatch');

module.exports = {
    match : matchContext
}

function matchContext (context, uri) {
    // single path
    if (isStringPath(context)) {
        return matchSingleStringPath(context, uri);
    }
    // single glob path
    if (isGlobPath(context)) {
        return matchSingleGlobPath(context, uri);
    }
    // multi path
    if (Array.isArray(context)) {
        if (context.every(isStringPath)) {
            return matchMultiPath(context, uri);
        }
        if (context.every(isGlobPath)) {
            return matchMultiGlobPath(context, uri);
        }

        throw new Error('[HPM] Invalid context. Expecting something like: ["/api", "/ajax"] or ["/api/**", "!**.html"]');
    }

    throw new Error('[HPM] Invalid context. Expecting something like: "/api" or ["/api", "/ajax"]');
}

/**
 * @param  {String} context '/api'
 * @param  {String} uri     'http://example.org/api/b/c/d.html'
 * @return {Boolean}
 */
function matchSingleStringPath (context, uri) {
    var path = getUrlPath(uri);
    return path.indexOf(context) === 0;
}

function matchSingleGlobPath (pattern, uri) {
    var path = getUrlPath(uri);
    var matches = micromatch(path, pattern);
    return matches && (matches.length > 0);
}

function matchMultiGlobPath (patternList, uri) {
    return matchSingleGlobPath(patternList, uri);
}

/**
 * @param  {String} context ['/api', '/ajax']
 * @param  {String} uri     'http://example.org/api/b/c/d.html'
 * @return {Boolean}
 */
function matchMultiPath (contextList, uri) {
    for (var i = 0; i < contextList.length; i++) {
        var context = contextList[i];
        if (matchSingleStringPath(context, uri)) {
            return true;
        }
    }
    return false;
}

function getUrlPath (uri) {
    return uri && url.parse(uri).path;
}

function isStringPath (context) {
    return typeof context === 'string' && !isGlob(context);
}

function isGlobPath (context) {
    return isGlob(context);
}
