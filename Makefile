tests: test_block test_request

test: tests

test_block:
	node_modules/.bin/mocha tests/block.js
	node_modules/.bin/mocha --delay tests/block.http.js

test_request:
	node_modules/.bin/mocha --delay tests/*.js

.PHONY: tests test test_block test_request

