var url = require('url');

module.exports = function (context, uri) {
    var urlPath = url.parse(uri).path;
    return urlPath.indexOf(context) === 0;
};
