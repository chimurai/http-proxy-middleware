Forward headers, patching set-cookie header to you don't have to run https localhost

save responses as foo.response.html or .response.json

depends on a target host variable like qa.site.com being defined

you can modify bodyStr(ing) before sending back to the web browser.

the names of missing packages match the name on npm. filenamify is filenamify. zlib is zlib.

```
  selfHandleResponse: true,
  onProxyRes: function relayResponseHeaders(proxyRes, req, res) {
      console.log('\nonProxyRes\n');
      // console.log('H-P-M: req:\n  ', Object.keys(req).join(', ')); // , '\n\n raw req:', , '\n\n');
      // console.log('H-P-M: proxyRes:\n  ', Object.keys(proxyRes).join(', ')); // , '\n\n raw proxyRes:', , '\n\n');
      // console.log('H-P-M: res:\n  ', Object.keys(res).join(', ')); // , '\n\n raw res:', , '\n\n');

      const sc = proxyRes.headers['set-cookie'];
      if (Array.isArray(sc)) {
          // console.log(
          //     'patching set-cookie header'
          //     // proxyRes.headers['set-cookie']
          // );
          proxyRes.headers['set-cookie'] = sc.map(sc => {
              return sc
                  .split(';')
                  .filter(v => v.trim().toLowerCase() !== 'secure')
                  .join('; ');
          });
          console.log(
              'patched set-cookie header.', // patched; is now:',
              // proxyRes.headers['set-cookie']
          );
      }
      Object.keys(proxyRes.headers).forEach(function(key) {
          res.append(key, proxyRes.headers[key]);
      });

      var chunks = [];
      proxyRes.on('data', (chunk) => {
          chunks.push(chunk);
      });

      let bodyStr = '';
      proxyRes.on('end', () => {
          var buffer = Buffer.concat(chunks);
          var encoding = proxyRes.headers['content-encoding'];
          // console.log('\n\n encoding!!!', encoding);
          if (encoding == 'gzip') {
              zlib.gunzip(buffer, function(err, decoded) {
                  bodyStr = decoded && decoded.toString();
              });
          } else if (encoding == 'deflate') {
              zlib.inflate(buffer, function(err, decoded) {
                  bodyStr = decoded && decoded.toString();
              })
          } else {
              bodyStr = buffer.toString();
          }
          if (recordJson) {
              console.log('req.url:', req.url);
              bodyStr = bodyStr.trim();
              // console.log(
              //     '\n\nbody:\n '
              // );
              let isJson = bodyStr.indexOf('{') === 0
              if (isJson) {
                  bodyStr = JSON.stringify(
                      JSON.parse(bodyStr),
                      null,
                      4
                  );
              }
              let path = req.url.substring(1, req.url.length).split('/');
              let fileName = filenamify(path.pop());
              let env = process.env.env_override || filenamify(targetHost.replace('https://', '').replace('http://', '').split('.')[0]);
              path = './cached-responses/' + env + '/' + path.join('/');
              console.log('path', path, 'fileName:', fileName);
              fs.mkdir(path, { recursive: true }, (err) => {
                  if (err) throw err;
              });
              let fileWithPath = path+'/'+fileName+'.response.' + (isJson ? 'json' : 'html');
              fs.writeFile(
                  fileWithPath,
                  bodyStr,
                  'utf8',
                  () => {
                      console.log('wrote', fileWithPath);
                  }
              );
          }
          res.write(bodyStr);
          res.end();
      });
  },
```
