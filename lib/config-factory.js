var _ = require('lodash');

module.exports = {
    createConfig : createConfig
}

function createConfig (context, opts) {
    var config = {
        context : undefined,
        options : {}
    };

    config.context = context;

    if (opts) {
        _.assign(config.options, opts);
    }

    config.options = mapLegacyProxyHostOption(config.options);

    return config;
};

// Legacy option.proxyHost
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
