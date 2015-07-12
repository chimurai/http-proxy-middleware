var url = require('url');

module.exports = {
    match           : matchContext,
    matchSinglePath : matchSinglePath,
    matchMultiPath  : matchMultiPath
}

function matchContext (context, uri) {
    // single path
    if (typeof context === 'string') {
        return matchSinglePath(context, uri);
    }
    // multi path
    if (Array.isArray(context)) {
        return matchMultiPath(context, uri);
    }

    throw new Error('[HPM] Invalid context. Expecting something like: "/api" or ["/api", "/ajax"]');
}

function matchSinglePath (context, uri) {
    var urlPath = url.parse(uri).path;
    return urlPath.indexOf(context) === 0;
}

function matchMultiPath (contextList, uri) {
    for (var i = 0; i < contextList.length; i++) {
        var context = contextList[i];
        if (matchSinglePath(context, uri)) {
            return true;
        }
    }
    return false;
}
