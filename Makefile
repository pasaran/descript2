TESTS = test_block_options_params \
	test_block_options_deps \
	test_block_options_before \
	test_block_options_after \
	test_block_http \
	test_block_file \
	test_request

tests: $(TESTS)

test_block_options_params:
	node_modules/.bin/mocha tests/block.options.params.js

test_block_options_deps:
	node_modules/.bin/mocha tests/block.options.deps.js

test_block_options_before:
	node_modules/.bin/mocha tests/block.options.before.js

test_block_options_after:
	node_modules/.bin/mocha tests/block.options.after.js

test_block_http:
	node_modules/.bin/mocha --delay tests/block.http.js

test_block_file:
	node_modules/.bin/mocha tests/block.file.js

test_request:
	node_modules/.bin/mocha --delay tests/request.js

.PHONY: tests $(TESTS)

