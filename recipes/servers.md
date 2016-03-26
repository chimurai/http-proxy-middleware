# Servers

Overview of `http-proxy-middleware` implementation in different servers.

Missing a server? Feel free to extend this list of examples.

<!-- MarkdownTOC autolink=true bracket=round -->

- [Browser-Sync](#browser-sync)
- [Express](#express)
- [Connect](#connect)
- [lite-server](#lite-server)
- [grunt-contrib-connect](#grunt-contrib-connect)
- [grunt-browser-sync](#grunt-browser-sync)
- [gulp-connect](#gulp-connect)
- [gulp-webserver](#gulp-webserver)

<!-- /MarkdownTOC -->

## Browser-Sync 

https://github.com/BrowserSync/browser-sync
[![GitHub stars](https://img.shields.io/github/stars/BrowserSync/browser-sync.svg?style=social&label=Star)](https://github.com/BrowserSync/browser-sync)

```javascript
var browserSync = require('browser-sync').create();
var proxy = require('http-proxy-middleware');

var apiProxy = proxy('/api', {
    target: 'http://www.example.org',
    changeOrigin: true   // for vhosted sites
});

browserSync.init({
    server: {
        baseDir: './',
        port: 3000,
        middleware: [apiProxy],
    },
    startPath: '/api'
});

```

## Express

https://github.com/expressjs/express
[![GitHub stars](https://img.shields.io/github/stars/expressjs/express.svg?style=social&label=Star)](https://github.com/expressjs/express)

```javascript
var express = require('express');
var proxy = require('http-proxy-middleware');

var apiProxy = proxy('/api', {
    target: 'http://www.example.org',
    changeOrigin: true   // for vhosted sites
});

var app = express();

app.use(apiProxy);
app.listen(3000);
```

## Connect

https://github.com/senchalabs/connect
[![GitHub stars](https://img.shields.io/github/stars/senchalabs/connect.svg?style=social&label=Star)](https://github.com/senchalabs/connect)

```javascript
var http = require('http');
var connect = require('connect');
var proxy = require('http-proxy-middleware');

var apiProxy = proxy('/api', {
    target: 'http://www.example.org',
    changeOrigin: true   // for vhosted sites
});

var app = connect();
app.use(apiProxy);

http.createServer(app).listen(3000);
```

## lite-server

https://github.com/johnpapa/lite-server
[![GitHub stars](https://img.shields.io/github/stars/johnpapa/lite-server.svg?style=social&label=Star)](https://github.com/johnpapa/lite-server)

File: `bs-config.js`

```javascript
var proxy = require('http-proxy-middleware');

var apiProxy = proxy('/api', {
    target: 'http://www.example.org',
    changeOrigin: true   // for vhosted sites
});

module.exports = {
    server: {
        middleware: {
            1: apiProxy
        }
    }
};
```

## grunt-contrib-connect

https://github.com/gruntjs/grunt-contrib-connect
[![GitHub stars](https://img.shields.io/github/stars/gruntjs/grunt-contrib-connect.svg?style=social&label=Star)](https://github.com/gruntjs/grunt-contrib-connect)

As an `Array`:
```javascript
var proxy = require('http-proxy-middleware');

var apiProxy = proxy('/api', {
    target: 'http://www.example.org',
    changeOrigin: true   // for vhosted sites
});

grunt.initConfig({
    connect: {
        server: {
            options: {
                middleware: [apiProxy],
            },
        },
    },
});
```

As a `function`:
```javascript
var proxy = require('http-proxy-middleware');

var apiProxy = proxy('/api', {
    target: 'http://www.example.org',
    changeOrigin: true   // for vhosted sites
});

grunt.initConfig({
  connect: {
    server: {
      options: {
        middleware: function(connect, options, middlewares) {
          // inject a custom middleware into the array of default middlewares
          middlewares.unshift(apiProxy);

          return middlewares;
        },
      },
    },
  },
});
```


## grunt-browser-sync

https://github.com/BrowserSync/grunt-browser-sync
[![GitHub stars](https://img.shields.io/github/stars/BrowserSync/grunt-browser-sync.svg?style=social&label=Star)](https://github.com/BrowserSync/grunt-browser-sync)


```javascript
var proxy = require('http-proxy-middleware');

var apiProxy = proxy('/api', {
    target: 'http://www.example.org',
    changeOrigin: true   // for vhosted sites
});

grunt.initConfig({

    // BrowserSync Task
    browserSync: {
        default_options: {
            options: {
                files: [
                    "css/*.css",
                    "*.html"
                ],
                port: 9000,
                server: {
                    baseDir: ['app'],
                    middleware: apiProxy
                }
            }
        }
    }

});
```

## gulp-connect

https://github.com/avevlad/gulp-connect
[![GitHub stars](https://img.shields.io/github/stars/avevlad/gulp-connect.svg?style=social&label=Star)](https://github.com/avevlad/gulp-connect)

```javascript
var gulp = require('gulp');
var connect = require('gulp-connect');
var proxy = require('http-proxy-middleware');

gulp.task('connect', function() {
    connect.server({
        root: ['./app'],
        middleware: function(connect, opt) {

            var apiProxy = proxy('/api', {
                target: 'http://www.example.org',
                changeOrigin: true   // for vhosted sites
            });

            return [apiProxy];
        }

    });
});

gulp.task('default', ['connect']);
```

## gulp-webserver

https://github.com/schickling/gulp-webserver
[![GitHub stars](https://img.shields.io/github/stars/schickling/gulp-webserver.svg?style=social&label=Star)](https://github.com/schickling/gulp-webserver)

```javascript
var gulp = require('gulp');
var webserver = require('gulp-webserver');
var proxy = require('http-proxy-middleware');

gulp.task('webserver', function() {
    var apiProxy = proxy('/api', {
        target: 'http://www.example.org',
        changeOrigin: true   // for vhosted sites
    });

    gulp.src('app')
        .pipe(webserver({
            livereload: true,
            directoryListing: true,
            open: true,
            middleware: [apiProxy]
        }));
});

gulp.task('default', ['webserver']);
```
