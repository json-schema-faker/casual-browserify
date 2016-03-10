var fs = require('fs'),
	path = require('path'),
	srcpath = path.resolve(__dirname + '/../src');

function getDataSources() {
	var providers = [],
		locales = {};

	fs.readdirSync(srcpath + '/providers/').forEach(function (item) {
		if (item.match(/\.js$/)) {
			providers.push(item.replace('.js', ''));
		} else if (item.match(/^[a-z]{2}_[A-Z]{2}$/)) {
			locales[item] = [];
		}
	});

	Object.keys(locales).forEach(function (locale) {
		fs.readdirSync(srcpath + '/providers/' + locale).forEach(function (item) {
			if (item.match(/\.js$/)) {
				locales[locale].push(item.replace(/.js$/, ''));
			}
		});
	});

	return {
		providers: providers,
		locales: locales
	};
}

function toRequires(sources) {
	var out = [],
		asObject = function (obj, prefix, indent) {
			var out = [];
			prefix = prefix || '';
			indent = indent || '';
			obj.forEach(function (item) {
				out.push(indent + item + ": require('" + prefix + item + "')");
			});
			return out.join(',\n');
		},
		a = function (x) {
			out.push(x);
			return out;
		};

	a('var providers = {\n');
	a(asObject(sources.providers, './providers/', '    '));
	a('\n};\n\n');

	a('var locales = {\n');

	Object.keys(sources.locales).forEach(function (locale) {
		a('    \'' + locale + '\': {\n');
		a(asObject(sources.locales[locale], './providers/' + locale + '/', '         '));
		a('\n    },\n');
	});
	out.pop();
	a('\n    }\n};');

	return out.join('');
}

function createTemplate() {
	var source = fs.readFileSync(srcpath + '/casual.js').toString(),
		start = source.indexOf('var safe_require = '),
		findFunction = function (src, start) {
			var perenCount = 0,
				add, remove;
			do {
				add = src.indexOf('{', start);
				remove = src.indexOf('}', start);
				if (add < remove) {
					perenCount += 1;
					start = add + 1;
				} else {
					perenCount -= 1;
					start = remove + 1;
				}
			} while (perenCount > 0);
			return start;
		},
		end = findFunction(source, start);

	return {
		start: source.slice(0, start),
		end: source.slice(end + 1)
	};
}

function generateCasualBrowserify(done) {
	var data = getDataSources(),
		template = createTemplate(),
		safeRequireSource = fs.readFileSync(srcpath + '/safe_require_browserify.js');

	fs.open(srcpath + '/casual_browserify.js', 'w', function (err, fd) {
		if (err) {
			throw err;
		}
		fs.writeSync(fd, "var helpers = require('./helpers');\n");
		fs.writeSync(fd, toRequires(data));
		fs.writeSync(fd, safeRequireSource.toString());
		fs.writeSync(fd, template.end);
		fs.close(fd, done);
		console.log('Generated casual_browserify.js');
	});
}

generateCasualBrowserify();



