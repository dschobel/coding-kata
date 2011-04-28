.PHONY: test dev clean deps test-deps

generate-js: ./src/*.coffee deps
	@echo 'generating js'; find src -name '*.coffee' | xargs coffee -c -o lib

deps:
	@test `which coffee` || echo 'You need to have CoffeeScript in your PATH.'

test-deps:
	@mkdir test_results; test `which ab` || echo 'You need to have apache bench in your PATH.'

clean:
	@rm -fr lib/

clean-tests:
	@rm -f test_results/*.out

dev: generate-js
	@echo 'watching ./src'; coffee -wc -o lib src/*.coffee

test-product-limit: generate-js test-deps clean-tests
	@echo "sending 120 requests for client:c1,product: p1";ab -v2 -n 120 "http://127.0.0.1:8000/?product=p1&client=c1" > test_results/product_test.out

test-global-limit: generate-js test-deps clean-tests
	@echo "sending 60 requests for client: c1,product: p1 and 60 for client:c1,product:p2";ab -v2 -n 60 "http://127.0.0.1:8000/?product=p1&client=c1" >> test_results/global_test.out; ab -v2 -n 60 "http://127.0.0.1:8000/?product=p2&client=c1" >> test_results/global_test.out
