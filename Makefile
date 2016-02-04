TESTS = options.params \
	options.select \
	options.deps \
	options.before \
	options.after \
	block.http \
	block.file \
	request

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

block.http:
	node_modules/.bin/mocha --delay tests/block.http.js

block.file:
	node_modules/.bin/mocha tests/block.file.js

request:
	node_modules/.bin/mocha --delay tests/request.js

.PHONY: tests $(TESTS)

