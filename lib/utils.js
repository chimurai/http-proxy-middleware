var url = require('url');

module.exports = {
    hasContext   : hasContext
}

function hasContext (context, uri) {
    var urlPath = url.parse(uri).path;
    return urlPath.indexOf(context) === 0;
};
