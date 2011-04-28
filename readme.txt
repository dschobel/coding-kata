Coding Kata entry by Daniel Schobel


For the rate limiter I implemented a two-tier leaky bucket in coffeescript running on the node.js network server.

The interesting bit of code is src/server.coffee

I chose this design since it would be trivial to integrate with any existing product which has network connectivity whether it's a website or a desktop application while still providing solid performace (see below).


INTERFACE:

The interface is HTTP, you issue a GET to the server with a product and client query parameter and it returns json to you.

a successful response will look like:  {"limited":false,"limittype":"none","client":"foo","product":"bar","globaltokens":99,"producttokens":39}
whereas a limited one will look like: {"limited":true,"limittype":"global","client":"foo","product":"bar","globaltokens":0,"producttokens":6}




TESTING:

If you're not motivated to get the dependencies listed below, the application can be found at: http://codingkata.duostack.net/
where you can hit it with apache bench: 'ab -n 1000 -c 100 -v 2 "http://codingkata.duostack.net/?product=p&client=c"'


DEPENDENCIES: 

Most of the dependencies are only readily available on a *nix environment.  

node.js: http://nodejs.org/
npm: http://npmjs.org/
coffeescript: 'npm install coffee-script'

if you're on os x and you have homebrew installed (https://github.com/mxcl/homebrew) you can just issue 'brew install node && curl http://npmjs.org/install.sh | sh && npm install coffee-script' to get all of the dependencies.



PERFORMANCE:

This solution handles approx 3k req/s when running locally on my fairly ancient macbook. The entire server runs in a single thread (ala nginx) so it should scale well (and preditably) by just plopping a load-balancer in front of a few instances of the application and moving the state to a KV data-store (like redis).

Memory usage will be linear with the number of clients, products and distinct rate limits (since timers are reused for all clients/products at the same limit).
