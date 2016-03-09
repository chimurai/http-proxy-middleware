var _      = require('lodash');
var url    = require('url');
var logger = require('./logger').getInstance();

module.exports = {
    createConfig: createConfig
};

function createConfig(context, opts) {
    // structure of config object to be returned
    var config = {
        context: undefined,
        options: {}
    };

    var useShortHand = isShortHand(context);

    if (useShortHand) {
        var oUrl   = url.parse(context);
        var target = [oUrl.protocol, '//', oUrl.host].join('');

        config.context = oUrl.pathname || '/';
        config.options = _.assign(config.options, {target: target}, opts);

        if (oUrl.protocol === 'ws:' || oUrl.protocol === 'wss:') {
            config.options.ws = true;
        }

    } else {
        config.context = context;
        config.options = _.assign(config.options, opts);
    }

    configureLogger(config.options);

    if (!config.options.target) {
        throw new Error('[HPM] Missing "target" option. Example: {target: "http://www.example.org"}');
    }

    // Legacy option.proxyHost
    config.options = mapLegacyProxyHostOption(config.options);

    return config;
};

function isShortHand(context) {
    if (_.isString(context)) {
        return (url.parse(context).host) ? true : false;
    }
}

function mapLegacyProxyHostOption(options) {
    // set options.headers.host when option.proxyHost is provided
    if (options.proxyHost) {
        logger.warn('*************************************');
        logger.warn('[HPM] Deprecated "option.proxyHost"');
        logger.warn('      Use "option.changeOrigin" or "option.headers.host" instead');
        logger.warn('      "option.proxyHost" will be removed in future release.');
        logger.warn('*************************************');

        options.headers = options.headers || {};
        options.headers.host = options.proxyHost;
    }

    return options;
}

function configureLogger(options) {
    if (options.logLevel) {
        logger.setLevel(options.logLevel);
    }

    if (options.logProvider) {
        logger.setProvider(options.logProvider);
    }
}
