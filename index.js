/**
 * @author Erik Desjardins
 * See LICENSE file in root directory for full license.
 */

'use strict';

var fileLoaderPath = require.resolve('file-loader');

function InertEntryPlugin() {}

InertEntryPlugin.prototype.apply = function(compiler) {
	// placeholder chunk name, to be removed from assets when Webpack emits them
	var placeholder = '__INERT_ENTRY_CHUNK_' + String(Math.random()).slice(2) + '__';
	var originalName;

	compiler.plugin('compilation', function(compilation, params) {
		// don't interfere with child compilers (i.e. used in entry-loader), since:
		// a. you probably don't want your child compilers to be inert
		// b. we don't get enough information from `compilation.options` (only `output`, no `entry`)
		if (this.isChild()) {
			return;
		}

		// replace the entry chunk output option with the placeholder
		// don't do this if the filename is already changed (i.e. on a subsequent watch build)
		if (!originalName || compilation.options.output.filename !== placeholder) {
			originalName = compilation.options.output.filename;
			compilation.options.output.filename = placeholder;
		}

		var entries = compilation.options.entry;
		if(typeof entries === 'function') entries = entries();
		if(typeof entries !== 'object') entries = { main: entries };

		params.normalModuleFactory.plugin('after-resolve', function(data, callback) {
			// match the raw request to one of the entry files
			var name;
			for (var key in entries) {
				if (!entries.hasOwnProperty(key)) continue;
				if (entries[key] === data.rawRequest) {
					name = key;
					break;
				}
			}
			if (name) {
				// interpolate `[chunkname]` ahead-of-time, so entry chunk names are used correctly
				var interpolatedName = originalName.replace(/\[chunkname\]/g, name);
				// prepend file-loader to the file's loaders, to create the output file
				data.loaders.unshift({
					loader: fileLoaderPath,
					options: { name: interpolatedName }
				});
			}
			callback(null, data);
		});
	});

	compiler.plugin('after-compile', function(compilation, callback) {
		if (this.isChild()) {
			callback();
			return;
		}

		// remove the placeholder asset that we replaced the entry chunk with
		delete compilation.assets[placeholder];
		callback();
	});
};

module.exports = InertEntryPlugin;
