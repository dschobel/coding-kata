var http = require('http');
var url = require('url');

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
    /*if(!ProductTokens[productKey]){
        console.log('bucket for productkey \'' + productKey + '\' does not exist, creating it');
        ProductTokens[productKey] 
            = new TokenBucket(PRODUCT_RPM);
        registerBucket(product_refill_rate, ProductTokens[productKey]);
    }*/

    if(!GlobalTokens[client].getToken()){
        console.log('hit global limit for ' + client);
        return true;
    }

    /*if(!ProductTokens[productKey].getToken()){
        console.log('hit product limit for ' + productKey);
        return true;
    }*/

    return false;
}

console.log('global request per minute limit is: ' + GLOBAL_RPM);
console.log('product request per minute limit is: ' + PRODUCT_RPM);
console.log('global refill rate will yield a new request every: ' + global_refill_rate + ' ms');
console.log('product refill rate will yield a new request every: ' + product_refill_rate + ' ms');


FAIL_MESSAGE = 'missing client and/or product parameters\n';
var s = http.createServer(function(req,res){
    var query = url.parse(req.url, true).query;
    if(!query.client || !query.product){
        
        res.writeHead(400, 
        {
            'Content-Length': FAIL_MESSAGE.length,
            'Content-Type':'text/plain'
        });
        res.end(FAIL_MESSAGE);
        return;
    }
    
    var base = query.client +','+query.product +': was ';
    res.writeHead(200, 
    {
        'Content-Type':'text/plain',
        'Content-Length': base.length + 9,
    });
    var limited = isRateLimited(query.client,query.product);
    if(limited)
    {
        res.end(base + 'DENIED  \n');
    }
    else{
        res.end(base+ 'ACCEPTED\n');
    }

});

s.listen(8000);
