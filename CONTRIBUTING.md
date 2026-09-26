# Contributing

We love contributors! Your help is welcome to make this project better!

Some simple guidelines we'd like you to follow.

## Got Questions or Problems?

If you have questions about http-proxy-middleware usage, please check whether your question has already been answered on [Stack Overflow](http://stackoverflow.com/search?q=%22http-proxy-middleware%22) or in our [FAQ](https://github.com/chimurai/http-proxy-middleware/issues/views/MDI0OlJlcG9zaXRvcnlTZWFyY2hTaG9ydGN1dDIyMTY%3D), [issue archive](https://github.com/chimurai/http-proxy-middleware/issues?utf8=%E2%9C%93&q=is%3Aissue+), [examples](https://github.com/chimurai/http-proxy-middleware/tree/master/examples) and [recipes](https://github.com/chimurai/http-proxy-middleware/tree/master/recipes).

As `httpxy` provides the actual proxy functionality, you might find your answer in their [documentation](https://github.com/unjs/httpxy), [issue archive](https://github.com/unjs/httpxy/issues?q=sort%3Aupdated-desc%20is%3Aissue) or have a look in the older [http-proxy examples](https://github.com/nodejitsu/node-http-proxy/tree/master/examples).

## Report Issues

[Create a new issue](https://github.com/chimurai/http-proxy-middleware/issues/new?template=bug.yml) if you think you've found an issue.

"_[It doesn't work](https://goo.gl/GzkkTg)_" is not very useful for anyone.
A good issue report should have a well-described **problem description**, along with the proxy **configuration**. A great issue report includes a **minimal example**.

Properly format your code example for easier reading: [Code and Syntax Highlighting](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#code-and-syntax-highlighting).

The quality of your issue report will determine how quickly and deeply we'll delve into it.

## New Feature?

[Request a new feature](https://github.com/chimurai/http-proxy-middleware/issues/new?template=feature.yml) in the issue tracker.

PRs are welcome. Please discuss it in our [GitHub issue tracker](https://github.com/chimurai/http-proxy-middleware/issues) before you start working on it, to avoid wasting your time and effort in case we are already working on it or planning to.

## Documentation

Feel free to send PRs to improve the documentation, [examples](https://github.com/chimurai/http-proxy-middleware/tree/master/examples) and [recipes](https://github.com/chimurai/http-proxy-middleware/tree/master/recipes).

## Quality Assurance

Run the following commands before opening a PR:

```bash
# install dependencies
$ yarn

# linting
$ yarn lint
$ yarn lint:fix

# building (compile typescript to js)
$ yarn build

# unit tests
$ yarn test

# code coverage
$ yarn coverage

# check spelling mistakes
$ yarn spellcheck
```
