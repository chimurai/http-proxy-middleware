.PHONY: clean install test

clean:
	rm -rf node_modules http-proxy-middleware.tgz

install:
	(cd ../.. && make install)
	(cd ../.. && npm pack)
	(mv ../../http-proxy-middleware-*.tgz ./http-proxy-middleware.tgz)
	yarn install

test:
	yarn test
