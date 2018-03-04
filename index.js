/**
 * @author Erik Desjardins
 * See LICENSE file in root directory for full license.
 */

'use strict';

const RawSource = require('webpack-sources').RawSource;

function InertEntryPlugin() {}

InertEntryPlugin.prototype.apply = function(compiler) {
	compiler.hooks.thisCompilation.tap(InertEntryPlugin.name, function(compilation,  { normalModuleFactory }) {
		// parser and generator originally assigned here:
		// https://github.com/webpack/webpack/blob/f916fc0bb70585cf04a92cd99e004e4879f1d337/lib/NormalModuleFactory.js#L317-L319
		// but it doesn't appear that we can interfere before this point,
		// so mutate the resolved object after resolution:
		// https://github.com/webpack/webpack/blob/f916fc0bb70585cf04a92cd99e004e4879f1d337/lib/NormalModuleFactory.js#L126
		normalModuleFactory.hooks.afterResolve.tap(InertEntryPlugin.name, data => {
			data.type = 'inert-entry-plugin';
			// https://github.com/webpack/webpack/blob/f916fc0bb70585cf04a92cd99e004e4879f1d337/lib/JsonModulesPlugin.js
			data.parser = {
				// https://github.com/webpack/webpack/blob/f916fc0bb70585cf04a92cd99e004e4879f1d337/lib/JsonParser.js
				parse(source, state) {
					state.module.buildInfo.source = source;
					return state;
				}
			};
			data.generator = {
				// https://github.com/webpack/webpack/blob/f916fc0bb70585cf04a92cd99e004e4879f1d337/lib/JsonGenerator.js
				generate(module) {
					return new RawSource(module.buildInfo.source);
				}
			};
		});
		// prevent the bootstrap code from being emitted
		// (can't override render directly because JavascriptModulesPlugin::renderJavascript forcibly appends a semicolon)
		// https://github.com/webpack/webpack/blob/f916fc0bb70585cf04a92cd99e004e4879f1d337/lib/MainTemplate.js#L118
		// https://github.com/webpack/webpack/blob/f916fc0bb70585cf04a92cd99e004e4879f1d337/lib/JavascriptModulesPlugin.js#L109
		// https://github.com/webpack-contrib/mini-css-extract-plugin/blob/31742323d4a6004ee4a2d2be92f642de01f66cbc/src/index.js#L107
		compilation.mainTemplate.hooks.renderManifest.tap(InertEntryPlugin.name, (result, { chunk, outputOptions }) => {
			if (chunk.getNumberOfModules() !== 1) {
				throw new Error('Assertion failed: inert entry point must have exactly 1 module');
			}
			result.push({
				render: () => chunk.entryModule.source(),
				filenameTemplate: chunk.filenameTemplate || outputOptions.filename,
				pathOptions: {
					chunk,
				},
				identifier: `inert-entry-plugin.${chunk.id}`
			});
			// kill any following plugins by returning a dummy array that they'll push to
			return [];
		});
	});
};

module.exports = InertEntryPlugin;
