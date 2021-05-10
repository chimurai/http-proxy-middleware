SHELL = /bin/sh

YARN = yarn
PRETTIER = $(YARN) prettier
ESLINT = $(YARN) eslint
JEST = $(YARN) test
TOUCH = touch

ARTIFACTS = dist coverage
SRC_TS := $(wildcard ./src/*.ts)
ESLINT_GLOB = "{src,test}/**/*.ts"
PRETTIER_GLOB = "**/*.{js,ts,md,yml,json,html}"

.DEFAULT_TARGET = all

.PHONY: clean coverage build lint lint-fix production test

all: production

install: node_modules

node_modules: yarn.lock
	$(YARN) install
	$(TOUCH) $@

production: install clean build
	rm dist/tsconfig.tsbuildinfo

clean:
	rm -rf $(ARTIFACTS)

build: dist

dist: $(SRC_TS)
	$(YARN) tsc
	$(TOUCH) $@

lint:
	$(ESLINT) $(ESLINT_GLOB)
	$(PRETTIER) --list-different $(PRETTIER_GLOB)

lint-fix:
	$(ESLINT) --fix $(ESLINT_GLOB)
	$(PRETTIER) --write $(PRETTIER_GLOB)

test-jest: clean build
	$(JEST)

test-pkg:
	(cd ./test/pkg && make clean install test)

coverage: clean build
	$(JEST) --coverage --coverageReporters=lcov
