var http = require('http');

PRODUCT_RPM = 40;
GLOBAL_RPM = 100;
global_refill_rate = Math.round(GLOBAL_RPM /0.06);//convert to ms
product_refill_rate = Math.round(PRODUCT_RPM/0.06);

GlobalTokens = {};
ProductTokens = {};
RateToBucketsMap = {};
IntervalIds ={};

function TokenBucket(limit){
    this.Limit = this.Tokens = limit;
    this.getToken = function(){
        if(this.Tokens < 1){
            return false;
        }
        this.Tokens--;
        return true;
   };
}
function refillEvent(rate){
    console.log('refill event for rate: ' + rate);
    for(bucketIdx in RateToBucketsMap[rate]){
        //ToDo: cleanup full token buckets
        var bucket = RateToBucketsMap[rate][bucketIdx];
        bucket.Tokens = Math.min(bucket.Limit,bucket.Tokens +1);
    }
}

function registerBucket(rate,bucket){
        //if the map of timers doesn't have an instance for this rate, create it
        if(!RateToBucketsMap[rate]){
            console.log('first bucket at rate ' + rate + ', creating new entry in rate map');
            RateToBucketsMap[rate] = [bucket];
        }
        else{
            console.log('associating bucket in the existing rate entry for ' + rate);
            RateToBucketsMap[rate].push(bucket);
        }

        if(!IntervalIds[rate]){
            console.log('bucket map does not contain a timer for rate: ' + rate);
            //IntervalIds[rate] = 'foo';
            IntervalIds[rate] = setInterval(refillEvent,rate,rate);
        }
        else{console.log('reusing existing timer for rate: ' + rate);}

}

function isRateLimited(client, product){
    var productKey = client + product;

    //if the bucket for this client doesn't exist, create it
    if(!GlobalTokens[client]){
        console.log('bucket for client \'' + client + '\' does not exist, creating it');
        GlobalTokens[client] = new TokenBucket(GLOBAL_RPM);
        //register the new bucket in the rate : buckets map
        registerBucket(global_refill_rate, GlobalTokens[client]);
    }
    if(!ProductTokens[productKey]){
        console.log('bucket for productkey \'' + productKey + '\' does not exist, creating it');
        ProductTokens[productKey] 
            = new TokenBucket(PRODUCT_RPM);
        registerBucket(product_refill_rate, ProductTokens[productKey]);
    }

    if(!GlobalTokens[client].getToken()){
        console.log('hit global limit');
        return true;
    }

    if(!ProductTokens[productKey].getToken()){
        console.log('hit product limit');
        return true;
    }

    return false;
}

console.log('global request per minute limit is: ' + GLOBAL_RPM);
console.log('product request per minute limit is: ' + PRODUCT_RPM);
console.log('global refill rate will yield a new request every: ' + global_refill_rate + ' ms');
console.log('product refill rate will yield a new request every: ' + product_refill_rate + ' ms');


setInterval(function(){
    console.log(isRateLimited('client1','product1') ? 'request for client1 and product1 was rate limit' : 'request for client1 and product1 was NOT rate limited');
    console.log(isRateLimited('client1','product2') ? 'request for client1 and product2 was rate limit' : 'request for client1 and product2 was NOT rate limited');
},500);

    

/*var s = http.createServer(function(req,res){
    if(!req['product'] || !req['client']){
        res.writeHead(400);
        res.end('bad request, product and client parameters are required');
    }
    res.writeHead(200, {'content-type':'text/plain'});
    res.end(isRateLimited);
});

s.listen(8000);
*/

