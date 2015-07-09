var url = require('url');

module.exports = {
    matchSinglePath : matchSinglePath,
    matchMultiPath  : matchMultiPath
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
