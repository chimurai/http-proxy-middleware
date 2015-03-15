var url = require('url');

function hasContext (context, uri) {
    var urlPath = url.parse(uri).path;
    return urlPath.indexOf(context) === 0;
}

module.exports = {
    hasContext: hasContext
}
