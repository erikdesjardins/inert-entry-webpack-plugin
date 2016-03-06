/**
 * @author Erik Desjardins
 * See LICENSE file in root directory for full license.
 */

'use strict';

var _ = require('lodash');
var fileLoaderPath = require.resolve('file-loader');

function InertEntryPlugin(options) {
	this.options = options || {};
}

InertEntryPlugin.prototype.apply = function(compiler) {
	// placeholder chunk name, to be removed from assets when Webpack emits them
	var placeholder = '__INERT_ENTRY_CHUNK_' + String(Math.random()).slice(2) + '__';
	var includeChildren = !!this.options.children;

	compiler.plugin('compilation', function(compilation) {
		// don't interfere with child compilers (i.e. used in entry-loader)
		if (this.isChild() && !includeChildren) {
			return;
		}

		// replace the entry chunk output option with the placeholder
		var originalName = compilation.options.output.filename;
		compilation.options.output.filename = placeholder;

		var entries = typeof compilation.options.entry === 'object' ?
			compilation.options.entry :
			{ main: compilation.options.entry };

		compilation.plugin('build-module', function(module) {
			// match the raw request to one of the entry files
			var name = _.findKey(entries, _.matches(module.rawRequest));
			if (name) {
				// interpolate `[chunkname]` ahead-of-time, so entry chunk names are used correctly
				var interpolatedName = originalName.replace(/\[chunkname\]/g, name);
				// prepend file-loader to the file's loaders, to create the output file
				module.loaders.unshift(fileLoaderPath + '?name=' + interpolatedName);
			}
		});
	});

	compiler.plugin('emit', function(compilation, callback) {
		// don't interfere with child compilers (i.e. used in entry-loader)
		if (this.isChild() && !includeChildren) {
			callback();
			return;
		}

		// remove the placeholder asset that we replaced the entry chunk with
		delete compilation.assets[placeholder];
		callback();
	});
};

module.exports = InertEntryPlugin;
