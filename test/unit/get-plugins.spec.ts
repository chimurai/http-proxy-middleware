import { Plugin } from '../../src/types';
import { getPlugins } from '../../src/get-plugins';
import {
  debugProxyErrorsPlugin,
  loggerPlugin,
  errorResponsePlugin,
  proxyEventsPlugin,
} from '../../src/plugins/default';

describe('getPlugins', () => {
  let plugins: Plugin[];

  it('should return default plugins when no user plugins are provided', () => {
    plugins = getPlugins({});

    expect(plugins).toHaveLength(4);
    expect(plugins.map((plugin) => plugin.name)).toMatchInlineSnapshot(`
      Array [
        "debugProxyErrorsPlugin",
        "proxyEventsPlugin",
        "loggerPlugin",
        "errorResponsePlugin",
      ]
    `);
  });

  it('should return no plugins when ejectPlugins is configured in option', () => {
    plugins = getPlugins({
      ejectPlugins: true,
    });

    expect(plugins).toHaveLength(0);
  });

  it('should return user plugins with default plugins when user plugins are provided', () => {
    const myPlugin: Plugin = () => {
      /* noop */
    };
    plugins = getPlugins({
      plugins: [myPlugin],
    });

    expect(plugins).toHaveLength(5);
    expect(plugins.map((plugin) => plugin.name)).toMatchInlineSnapshot(`
      Array [
        "debugProxyErrorsPlugin",
        "proxyEventsPlugin",
        "loggerPlugin",
        "errorResponsePlugin",
        "myPlugin",
      ]
    `);
  });

  it('should only return user plugins when user plugins are provided with ejectPlugins option', () => {
    const myPlugin: Plugin = () => {
      /* noop */
    };
    plugins = getPlugins({
      ejectPlugins: true,
      plugins: [myPlugin],
    });

    expect(plugins).toHaveLength(1);
    expect(plugins.map((plugin) => plugin.name)).toMatchInlineSnapshot(`
      Array [
        "myPlugin",
      ]
    `);
  });

  it('should return manually added default plugins in different order after using ejectPlugins', () => {
    plugins = getPlugins({
      ejectPlugins: true,
      plugins: [debugProxyErrorsPlugin, errorResponsePlugin, loggerPlugin, proxyEventsPlugin], // alphabetical order
    });

    expect(plugins).toHaveLength(4);
    expect(plugins.map((plugin) => plugin.name)).toMatchInlineSnapshot(`
      Array [
        "debugProxyErrorsPlugin",
        "errorResponsePlugin",
        "loggerPlugin",
        "proxyEventsPlugin",
      ]
    `);
  });

  it('should not configure errorResponsePlugin when user specifies their own error handler', () => {
    const myErrorHandler = () => {
      /* noop */
    };
    plugins = getPlugins({
      on: {
        error: myErrorHandler,
      },
    });

    expect(plugins).toHaveLength(3);
    expect(plugins.map((plugin) => plugin.name)).toMatchInlineSnapshot(`
      Array [
        "debugProxyErrorsPlugin",
        "proxyEventsPlugin",
        "loggerPlugin",
      ]
    `);
  });
});
