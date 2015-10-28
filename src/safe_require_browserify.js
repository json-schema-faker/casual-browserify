
var safe_require = function(filename) {
	var parts = filename.split(require('path').sep).slice(-2),
		locale = parts[0],
		provider = parts[1];

	return locales[locale][provider] || {};
};

