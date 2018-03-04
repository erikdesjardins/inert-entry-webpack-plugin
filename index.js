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

	compiler.hooks.compilation.tap(InertEntryPlugin.name, function(compilation, params) {
		// don't interfere with child compilers (i.e. used in entry-loader), since:
		// a. you probably don't want your child compilers to be inert
		// b. we don't get enough information from `compilation.options` (only `output`, no `entry`)
		if (compilation.compiler.isChild()) {
			return;
		}

		// replace the entry chunk output option with the placeholder
		// don't do this if the filename is already changed (i.e. on a subsequent watch build)
		if (!originalName || compilation.options.output.filename !== placeholder) {
			originalName = compilation.options.output.filename;
			compilation.options.output.filename = placeholder;
		}

		var entries = compilation.options.entry;
		if (typeof entries === 'function') entries = entries();
		if (typeof entries !== 'object') entries = { main: entries };

		params.normalModuleFactory.hooks.beforeResolve.tap(InertEntryPlugin.name, function(data) {
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
			return data;
		});
	});

	compiler.hooks.afterCompile.tap(InertEntryPlugin.name, function(compilation) {
		// remove the placeholder asset that we replaced the entry chunk with
		delete compilation.assets[placeholder];
	});
};

module.exports = InertEntryPlugin;
