import { readFileSync, statSync } from 'fs';
import { join } from 'path';

import test from 'ava';
import webpack from 'webpack';
import rimraf from 'rimraf';

import InertEntryPlugin from '../index';

test('basic usage', async t => {
	await new Promise((resolve, reject) => {
		webpack({
			entry: {
				one: join(__dirname, 'src/main.html'),
				two: join(__dirname, 'src/other.html')
			},
			bail: true,
			output: {
				path: join(__dirname, 'dist'),
				filename: '[name]-dist.html'
			},
			module: {
				loaders: [
					{ test: /\.html$/, loaders: ['extricate', 'html?attrs=img:src script:src'] },
					{ test: /\.jpg$/, loader: 'file?name=[name]-dist.[ext]' },
					{ test: /\.js$/, loader: 'spawn?name=[name]-dist.js' }
				]
			},
			plugins: [
				new InertEntryPlugin()
			]
		}, (err, stats) => {
			err ? reject(err) : resolve(stats);
		});
	});

	const oneDistHtml = readFileSync(join(__dirname, 'dist/one-dist.html'));
	const twoDistHtml = readFileSync(join(__dirname, 'dist/two-dist.html'));
	const hiDistJpg = readFileSync(join(__dirname, 'dist/hi-dist.jpg'));
	const appDistJs = readFileSync(join(__dirname, 'dist/app-dist.js'));

	t.regex(oneDistHtml, /^<!DOCTYPE html>/, 'no prelude');
	t.regex(oneDistHtml, /<script src="app-dist\.js"><\/script>/, 'references app-dist.js');

	t.regex(twoDistHtml, /^<!DOCTYPE html>/, 'no prelude');
	t.regex(twoDistHtml, /<img src="hi-dist\.jpg"\/>/, 'references hi-dist.jpg');

	t.ok(hiDistJpg, 'non-empty');

	t.regex(appDistJs, /\bfunction __webpack_require__\b/, 'has prelude');
	t.regex(appDistJs, /module\.exports = null;/, 'has exports');
});

test.after(t => {
	rimraf.sync(join(__dirname, 'dist'));
});
