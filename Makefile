TESTS = options.params \
	options.select \
	options.deps \
	options.before \
	options.after \
	options.guard \
	options.result \
	options.cache \
	options.timeout \
	options.priority \
	options.required \
	block.http \
	block.file \
	block.object \
	block.func \
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

options.priority:
	node_modules/.bin/mocha tests/options.priority.js

options.required:
	node_modules/.bin/mocha tests/options.required.js

block.http:
	node_modules/.bin/mocha --delay tests/block.http.js

block.file:
	node_modules/.bin/mocha tests/block.file.js

block.object:
	node_modules/.bin/mocha --delay tests/block.object.js

block.func:
	node_modules/.bin/mocha --delay tests/block.func.js

request:
	node_modules/.bin/mocha --delay tests/request.js

context:
	node_modules/.bin/mocha --delay tests/context.js

dir-config:
	node_modules/.bin/mocha tests/dir-config.js

lint:
	node_modules/.bin/eslint lib/*.js

.PHONY: tests $(TESTS) lint

