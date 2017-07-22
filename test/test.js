import { readFileSync, statSync } from 'fs';
import { join } from 'path';

import test from 'ava';
import webpack from 'webpack';
import rimraf from 'rimraf';

import InertEntryPlugin from '../index';

function randomPath() {
	return join(__dirname, 'dist', String(Math.random()).slice(2));
}

test('single entry chunk', async t => {
	const out = randomPath();

	await new Promise((resolve, reject) => {
		webpack({
			entry: join(__dirname, 'src/main.html'),
			bail: true,
			output: {
				path: out,
				filename: '[chunkname]-dist.html'
			},
			module: {
				loaders: [
					{ test: /\.html$/, loaders: ['extricate-loader', 'html-loader?attrs=img:src script:src'] },
					{ test: /\.js$/, loader: 'spawn-loader?name=[name]-dist.js' }
				]
			},
			plugins: [
				new InertEntryPlugin()
			]
		}, (err, stats) => {
			err ? reject(err) : resolve(stats);
		});
	});

	const mainDistHtml = readFileSync(join(out, 'main-dist.html'), 'utf8');
	const appDistJs = readFileSync(join(out, 'app-dist.js'), 'utf8');

	t.regex(mainDistHtml, /^<!DOCTYPE html>/, 'no prelude');
	t.regex(mainDistHtml, /<script src="app-dist\.js"><\/script>/, 'references app-dist.js');

	t.regex(appDistJs, /\bfunction __webpack_require__\b/, 'has prelude');
	t.regex(appDistJs, /module\.exports = 'this should not be imported';/, 'has exports');
});

test('multiple entry chunks', async t => {
	const out = randomPath();

	await new Promise((resolve, reject) => {
		webpack({
			entry: {
				one: join(__dirname, 'src/main.html'),
				two: join(__dirname, 'src/other.html')
			},
			bail: true,
			output: {
				path: out,
				filename: '[chunkname]-dist.html'
			},
			module: {
				loaders: [
					{ test: /\.html$/, loaders: ['extricate-loader', 'html-loader?attrs=img:src script:src'] },
					{ test: /\.jpg$/, loader: 'file-loader?name=[name]-dist.[ext]' },
					{ test: /\.js$/, loader: 'spawn-loader?name=[name]-dist.js' }
				]
			},
			plugins: [
				new InertEntryPlugin()
			]
		}, (err, stats) => {
			err ? reject(err) : resolve(stats);
		});
	});

	const oneDistHtml = readFileSync(join(out, 'one-dist.html'), 'utf8');
	const twoDistHtml = readFileSync(join(out, 'two-dist.html'), 'utf8');
	const hiDistJpg = readFileSync(join(out, 'hi-dist.jpg'));
	const appDistJs = readFileSync(join(out, 'app-dist.js'), 'utf8');

	t.regex(oneDistHtml, /^<!DOCTYPE html>/, 'no prelude');
	t.regex(oneDistHtml, /<script src="app-dist\.js"><\/script>/, 'references app-dist.js');

	t.regex(twoDistHtml, /^<!DOCTYPE html>/, 'no prelude');
	t.regex(twoDistHtml, /<img src="hi-dist\.jpg"\/>/, 'references hi-dist.jpg');

	t.truthy(hiDistJpg, 'non-empty');

	t.regex(appDistJs, /\bfunction __webpack_require__\b/, 'has prelude');
	t.regex(appDistJs, /module\.exports = 'this should not be imported';/, 'has exports');
});

test('single entry chunk though function', async t => {
	const out = randomPath();

	await new Promise((resolve, reject) => {
		webpack({
			entry: () => join(__dirname, 'src/main.html'),
			bail: true,
			output: {
				path: out,
				filename: '[chunkname]-dist.html'
			},
			module: {
				loaders: [
					{ test: /\.html$/, loaders: ['extricate-loader', 'html-loader?attrs=img:src script:src'] },
					{ test: /\.js$/, loader: 'spawn-loader?name=[name]-dist.js' }
				]
			},
			plugins: [
				new InertEntryPlugin()
			]
		}, (err, stats) => {
			err ? reject(err) : resolve(stats);
		});
	});

	const mainDistHtml = readFileSync(join(out, 'main-dist.html'), 'utf8');
	const appDistJs = readFileSync(join(out, 'app-dist.js'), 'utf8');

	t.regex(mainDistHtml, /^<!DOCTYPE html>/, 'no prelude');
	t.regex(mainDistHtml, /<script src="app-dist\.js"><\/script>/, 'references app-dist.js');

	t.regex(appDistJs, /\bfunction __webpack_require__\b/, 'has prelude');
	t.regex(appDistJs, /module\.exports = 'this should not be imported';/, 'has exports');
});

test('substituting [name] instead of [chunkname]', async t => {
	const out = randomPath();

	await new Promise((resolve, reject) => {
		webpack({
			entry: join(__dirname, 'src/other.html'),
			bail: true,
			output: {
				path: out,
				filename: '[name]-dist.html'
			},
			module: {
				loaders: [
					{ test: /\.html$/, loaders: ['extricate-loader', 'html-loader'] },
					{ test: /\.jpg$/, loader: 'file-loader?name=[name]-dist.[ext]' }
				]
			},
			plugins: [
				new InertEntryPlugin()
			]
		}, (err, stats) => {
			err ? reject(err) : resolve(stats);
		});
	});

	const otherDistHtml = readFileSync(join(out, 'other-dist.html'), 'utf8');

	t.regex(otherDistHtml, /^<!DOCTYPE html>/, 'no prelude');
	t.regex(otherDistHtml, /<img src="hi-dist\.jpg"\/>/, 'references hi-dist.jpg');
});

test.after(t => {
	rimraf.sync(join(__dirname, 'dist'));
});
