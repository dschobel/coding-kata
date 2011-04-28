.PHONY: generate-js deps remove-js test daniel dev

generate-js: deps
	@echo 'gen-js is running'; find src -name '*.coffee' | xargs coffee -c -o lib

remove-js:
	@rm -fr lib/

deps:
	@echo 'deps is running'; test `which coffee` || echo 'You need to have CoffeeScript in your PATH.\nPlease install it using `brew install coffee-script` or `npm install coffee-script`.'; test `which node` || echo 'You need to have nodejs in your PATH.\nPlease install it using `brew install node` or from http://nodejs.org/'

test: deps
	@echo 'test is running'; find test -name '*_test.coffee' | xargs -n 1 -t coffee


dev: generate-js
	@echo 'watching ./src'; coffee -wc -o lib src/*.coffee
