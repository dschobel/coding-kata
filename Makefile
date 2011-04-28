.PHONY: test dev clean

generate-js: ./src/*.coffee
	@echo 'generating js'; find src -name '*.coffee' | xargs coffee -c -o lib

clean:
	@rm -fr lib/

dev: generate-js
	@echo 'watching ./src'; coffee -wc -o lib src/*.coffee

test: generate-js
	@echo "running tests";./test.sh
