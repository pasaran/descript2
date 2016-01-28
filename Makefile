TESTS = block.options.params \
	block.options.deps \
	block.options.before \
	block.options.after \
	block.http \
	block.file \
	request

tests: $(TESTS)

block.options.params:
	node_modules/.bin/mocha tests/block.options.params.js

block.options.deps:
	node_modules/.bin/mocha tests/block.options.deps.js

block.options.before:
	node_modules/.bin/mocha tests/block.options.before.js

block.options.after:
	node_modules/.bin/mocha tests/block.options.after.js

block.http:
	node_modules/.bin/mocha --delay tests/block.http.js

block.file:
	node_modules/.bin/mocha tests/block.file.js

request:
	node_modules/.bin/mocha --delay tests/request.js

.PHONY: tests $(TESTS)

