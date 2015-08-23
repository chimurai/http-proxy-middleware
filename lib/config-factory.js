var _   = require('lodash');
var url = require('url');

module.exports = {
    createConfig : createConfig
};

function createConfig (context, opts) {
    // structure of config object to be returned
    var config = {
        context : undefined,
        options : {}
    };

    var useShortHand = isShortHand(context);

    if (useShortHand) {
        var oUrl   = url.parse(context);
        var target = [oUrl.protocol, '//', oUrl.host].join('');

        config.context = oUrl.pathname;
        config.options = _.assign(config.options, {target:target}, opts);
    } else {
        config.context = context;
        config.options = _.assign(config.options, opts);
    }

    // Legacy option.proxyHost
    config.options = mapLegacyProxyHostOption(config.options);

    if (!config.options.target) {
        throw new Error('[HPM] Missing "target" option. Example: {target: "http://www.example.org"}');
    }

    return config;
};

function isShortHand (context) {
    if (_.isString(context)) {
        return (url.parse(context).host) ? true : false;
    }
}

function mapLegacyProxyHostOption (options) {
    // set options.headers.host when option.proxyHost is provided
    if (options.proxyHost) {
        console.log('*************************************');
        console.log('[HPM] Deprecated "option.proxyHost"');
        console.log('      Use "option.changeOrigin" or "option.headers.host" instead');
        console.log('      "option.proxyHost" will be removed in future release.');
        console.log('*************************************');

        options.headers = options.headers || {};
        options.headers.host = options.proxyHost;
    }

    return options;
}
