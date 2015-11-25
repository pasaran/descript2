test: tests

tests: test_block test_request

test_block: test_block_base test_block_http

test_block_base:
	node_modules/.bin/mocha tests/block.js

test_block_http:
	node_modules/.bin/mocha --delay tests/block.http.js

test_block_file:
	node_modules/.bin/mocha tests/block.file.js

test_request:
	node_modules/.bin/mocha --delay tests/request.js

.PHONY: test tests test_block test_block_base test_block_http test_request

