# inert-entry-webpack-plugin [![Build Status](https://travis-ci.org/erikdesjardins/inert-entry-webpack-plugin.svg?branch=master)](https://travis-ci.org/erikdesjardins/inert-entry-webpack-plugin)

Webpack plugin to allow non-js entry chunks.

Webpack requires that all entry chunks emit valid JS.
However, the actual entry point for a webapp is usually HTML.

This plugin allows the use of any non-JS ("inert") file in an entry chunk, and prevents Webpack from adding its wrapper to those chunks.

Use [`entry-loader`](https://github.com/eoin/entry-loader) or equivalent to emit normal entry points for JS files required in your HTML.

## Installation

`npm install --save-dev inert-entry-webpack-plugin`

## Options

`new InertEntryPlugin({ children: true })` (default `false`):

Whether or not child compilers' (e.g. those created by `entry-loader`) entry chunks should also be made inert.

## Usage

**webpack.config.js:**

```js
var InertEntryPlugin = require('inert-entry-webpack-plugin');

module.exports = {
  entry: {
    nameOfEntryChunk: 'index.html'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    // Note: the `[chunkhash]` substitution does not work here, due to the use of file-loader
    filename: '[name].[hash].html'
  },
  module: {
    loaders: [
      { test: /\.html$/, loaders: ['extract', 'html?attrs=link:href script:src'] },
      { test: /\.css$/, loaders: ['file', 'extract', 'css'] }
    ]
  },
  plugins: [
    new InertEntryPlugin()
  ]
  // ...
};
```

**index.html**:

```html
<html>
<head>
  <link rel="stylesheet" href="./main.css" type="text/css">
  <script src="entry!app.js"></script>
</head>
<body>...</body>
</html>
```

### Output

**nameOfEntryChunk.0dcbbaa701328a3c262cfd45869e351f.html:**

Notice that Webpack's wrapper is not present, as you would expect for an entry chunk.

`main.bundle.js` *will* contain the wrapper, however, because it's loaded with `entry-loader`.

```html
<html>
<head>
  <link rel="stylesheet" href="e43b20c069c4a01867c31e98cbce33c9.css" type="text/css">
  <script src="main.bundle.js"></script>
</head>
<body>...</body>
</html>
```
