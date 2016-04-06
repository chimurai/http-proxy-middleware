##Modify Post Parameters:
The code example below illustrates how to modify POST body data prior to forwarding to the proxy target.
Key to this example is the *"OnProxyReq"* event handler  that creates a new POST body that can be manipulated to format the POST data as required.  For example: inject new POST parameters that should only be visible server side.

This example uses the *"body-parser"* module in the main app to create a req.body object with the decoded POST parameters.   Side note - the code below will allow *"http-proxy-middleware"* to work with *"body-parser"*.

Since this only modifys the request body stream the original POST body parameters remain in tact, so any POST data changes will not be sent back in the response to the client.

## Example:

    'use strict';
    
    var express = require('express');
    var ProxyMiddleware = require('http-proxy-middleware');
    var router = express.Router();
    
    var proxy_filter = function (path, req) {
        return path.match('^/docs') && ( req.method === 'GET' || req.method === 'POST' );
    };
    
    var proxy_options = {
        target: 'http://localhost:8080',
        pathRewrite: {
            '^/docs' : '/java/rep/server1' // Host path & target path conversion
        },
        onError(err, req, res) {
            res.writeHead(500, {
                'Content-Type': 'text/plain'
            });
            res.end('Something went wrong. And we are reporting a custom error message.' + err);
        },
        onProxyReq(proxyReq, req, res) {
            if ( req.method == "POST" && req.body ) {
                // Add req.body logic here if needed....
    
               // ....
    
                // Remove body-parser body object from the request
                if ( req.body ) delete req.body;
    
                // Make any needed POST parameter changes
                let body = new Object();
    
                body.filename = 'reports/statistics/summary_2016.pdf';
                body.routeid = 's003b012d002';
                body.authid = 'bac02c1d-258a-4177-9da6-862580154960';
    
                // URI encode JSON object
                body = Object.keys( body ).map(function( key ) {
                    return encodeURIComponent( key ) + '=' + encodeURIComponent( body[ key ])
                }).join('&');
    
                // Update header
                proxyReq.setHeader( 'content-type', 'application/x-www-form-urlencoded' );
                proxyReq.setHeader( 'content-length', body.length );
    
                // Write out body changes to the proxyReq stream
                proxyReq.write( body );
                proxyReq.end();
            }
        }
    };
    
    // Proxy configuration
    var proxy = ProxyMiddleware( proxy_filter, proxy_options );
    
    /* GET home page. */
    router.get('/', function(req, res, next) {
        res.render('index', { title: 'Node.js Express Proxy Test' });
    });
    
    router.all('/docs', proxy );
    
    module.exports = router;
