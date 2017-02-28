# inert-entry-webpack-plugin [![Build Status](https://travis-ci.org/erikdesjardins/inert-entry-webpack-plugin.svg?branch=master)](https://travis-ci.org/erikdesjardins/inert-entry-webpack-plugin)

Webpack plugin to allow non-js entry chunks.

Webpack requires that all entry chunks emit valid JS.
However, sometimes you want to use HTML or a manifest file as your entry point.

This plugin allows the use of any non-JS ("inert") file in an entry chunk, and prevents Webpack from adding its wrapper to those chunks.
This only affects the main compiler, not any child compilers.

Use [`entry-loader`](https://github.com/eoin/entry-loader) or [`spawn-loader`](https://github.com/erikdesjardins/spawn-loader) to emit normal entry points for JS files required in your HTML or manifest files.

## Installation

`npm install --save-dev inert-entry-webpack-plugin`

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
    // Note: substitutions here are handled by `file-loader`, not Webpack as usual
    // use `[chunkname]` in place of `[name]` if you want the name of the entry chunk
    filename: '[chunkname].[hash].html'
  },
  module: {
    rules: [
      { test: /\.html$/, use: ['extract-loader', { loader: 'html-loader', options: { attrs: ['link:href', 'script:src'] } }] },
      { test: /\.css$/, use: ['file-loader', 'extract-loader', 'css-loader'] }
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
  <script src="entry-loader!app.js"></script>
</head>
<body>...</body>
</html>
```

### Output

**nameOfEntryChunk.0dcbbaa701328a3c262cfd45869e351f.html:**

```html
<html>
<head>
  <link rel="stylesheet" href="e43b20c069c4a01867c31e98cbce33c9.css" type="text/css">
  <script src="main.bundle.js"></script>
</head>
<body>...</body>
</html>
```

Notice that Webpack's wrapper is not present, as you would expect for an entry chunk.

`main.bundle.js` *will* contain the wrapper, however, because it's loaded with `entry-loader`.
