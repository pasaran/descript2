TESTS = options.params \
	options.select \
	options.deps \
	options.before \
	options.after \
	options.guard \
	options.result \
	options.cache \
	options.timeout \
	block.http \
	block.file \
	request \
	context \
	dir-config

tests: $(TESTS)

options.params:
	node_modules/.bin/mocha tests/options.params.js

options.select:
	node_modules/.bin/mocha tests/options.select.js

options.deps:
	node_modules/.bin/mocha tests/options.deps.js

options.before:
	node_modules/.bin/mocha tests/options.before.js

options.after:
	node_modules/.bin/mocha tests/options.after.js

options.guard:
	node_modules/.bin/mocha tests/options.guard.js

options.result:
	node_modules/.bin/mocha tests/options.result.js

options.cache:
	node_modules/.bin/mocha tests/options.cache.js

options.timeout:
	node_modules/.bin/mocha tests/options.timeout.js

block.http:
	node_modules/.bin/mocha --delay tests/block.http.js

block.file:
	node_modules/.bin/mocha tests/block.file.js

request:
	node_modules/.bin/mocha --delay tests/request.js

context:
	node_modules/.bin/mocha --delay tests/context.js

dir-config:
	node_modules/.bin/mocha tests/dir-config.js

.PHONY: tests $(TESTS)

