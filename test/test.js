import { readFileSync, statSync } from 'fs';
import { join } from 'path';

import test from 'ava';
import webpack from 'webpack';
import rimraf from 'rimraf';

import InertEntryPlugin from '../index';

function randomPath() {
	return join(__dirname, 'dist', String(Math.random()).slice(2));
}

function runWebpack(options) {
	return new Promise((resolve, reject) => {
		webpack({
			mode: 'development',
			devtool: false,
			bail: true,
			plugins: [
				new InertEntryPlugin()
			],
			...options
		}, (err, stats) => {
			stats.hasErrors() ? reject(stats.toString()) : resolve(stats);
		});
	});
}

test('single entry chunk', async t => {
	const out = randomPath();

	await runWebpack({
		entry: join(__dirname, 'src/main.html'),
		output: {
			path: out,
			filename: '[name]-dist.html'
		},
		module: {
			rules: [
				{ test: /\.html$/, use: ['extricate-loader', 'html-loader?attrs=img:src script:src'] },
				{ test: /\.js$/, use: 'spawn-loader?name=[name]-dist.js' }
			]
		},
	});

	const mainDistHtml = readFileSync(join(out, 'main-dist.html'), 'utf8');
	const appDistJs = readFileSync(join(out, 'app-dist.js'), 'utf8');

	t.regex(mainDistHtml, /^<!DOCTYPE html>/, 'no prelude');
	t.notRegex(mainDistHtml, /;/, 'no semicolons');
	t.regex(mainDistHtml, /<script src="app-dist\.js"><\/script>/, 'references app-dist.js');

	t.regex(appDistJs, /\bfunction __webpack_require__\b/, 'has prelude');
	t.regex(appDistJs, /module\.exports = 'this should not be imported';/, 'has exports');
});

test('named single entry', async t => {
	const out = randomPath();

	await runWebpack({
		entry: {
			other: join(__dirname, 'src/other.html')
		},
		output: {
			path: out,
			filename: '[name]-dist.html'
		},
		module: {
			rules: [
				{ test: /\.html$/, use: ['extricate-loader', 'html-loader'] },
				{ test: /\.jpg$/, use: 'file-loader?name=[name]-dist.[ext]' }
			]
		},
	});

	const otherDistHtml = readFileSync(join(out, 'other-dist.html'), 'utf8');

	t.regex(otherDistHtml, /^<!DOCTYPE html>/, 'no prelude');
	t.notRegex(otherDistHtml, /;/, 'no semicolons');
	t.regex(otherDistHtml, /<img src="hi-dist\.jpg"\/>/, 'references hi-dist.jpg');
});

test('multiple entry chunks', async t => {
	const out = randomPath();

	await runWebpack({
		entry: {
			one: join(__dirname, 'src/main.html'),
			two: join(__dirname, 'src/other.html')
		},
		output: {
			path: out,
			filename: '[name]-dist.html'
		},
		module: {
			rules: [
				{ test: /\.html$/, use: ['extricate-loader', 'html-loader?attrs=img:src script:src'] },
				{ test: /\.jpg$/, use: 'file-loader?name=[name]-dist.[ext]' },
				{ test: /\.js$/, use: 'spawn-loader?name=[name]-dist.js' }
			]
		},
	});

	const oneDistHtml = readFileSync(join(out, 'one-dist.html'), 'utf8');
	const twoDistHtml = readFileSync(join(out, 'two-dist.html'), 'utf8');
	const hiDistJpg = readFileSync(join(out, 'hi-dist.jpg'));
	const appDistJs = readFileSync(join(out, 'app-dist.js'), 'utf8');

	t.regex(oneDistHtml, /^<!DOCTYPE html>/, 'no prelude');
	t.notRegex(oneDistHtml, /;/, 'no semicolons');
	t.regex(oneDistHtml, /<script src="app-dist\.js"><\/script>/, 'references app-dist.js');

	t.regex(twoDistHtml, /^<!DOCTYPE html>/, 'no prelude');
	t.notRegex(twoDistHtml, /;/, 'no semicolons');
	t.regex(twoDistHtml, /<img src="hi-dist\.jpg"\/>/, 'references hi-dist.jpg');

	t.truthy(hiDistJpg, 'non-empty');

	t.regex(appDistJs, /\bfunction __webpack_require__\b/, 'has prelude');
	t.regex(appDistJs, /module\.exports = 'this should not be imported';/, 'has exports');
});

test('single entry chunk though function', async t => {
	const out = randomPath();

	await runWebpack({
		entry: () => join(__dirname, 'src/main.html'),
		output: {
			path: out,
			filename: '[name]-dist.html'
		},
		module: {
			rules: [
				{ test: /\.html$/, use: ['extricate-loader', 'html-loader?attrs=img:src script:src'] },
				{ test: /\.js$/, use: 'spawn-loader?name=[name]-dist.js' }
			]
		},
	});

	const mainDistHtml = readFileSync(join(out, 'main-dist.html'), 'utf8');
	const appDistJs = readFileSync(join(out, 'app-dist.js'), 'utf8');

	t.regex(mainDistHtml, /^<!DOCTYPE html>/, 'no prelude');
	t.notRegex(mainDistHtml, /;/, 'no semicolons');
	t.regex(mainDistHtml, /<script src="app-dist\.js"><\/script>/, 'references app-dist.js');

	t.regex(appDistJs, /\bfunction __webpack_require__\b/, 'has prelude');
	t.regex(appDistJs, /module\.exports = 'this should not be imported';/, 'has exports');
});

test.after(t => {
	rimraf.sync(join(__dirname, 'dist'));
});
