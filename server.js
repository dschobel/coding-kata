var http = require('http'),
    url = require('url'),
    redis = require("redis").createClient();


PRODUCT_RPM = 40;
GLOBAL_RPM = 100;
FAIL_MESSAGE = 'missing client and/or product parameters\n';
global_refill_rate = Math.round(GLOBAL_RPM /0.06);//convert to ms
product_refill_rate = Math.round(PRODUCT_RPM/0.06);

GlobalTokens = {};
ProductTokens = {};
RateToProductBucketsMap = {};
RateToGlobalBucketsMap = {};
IntervalIds ={};

IntervalIds[global_refill_rate] = setInterval(refillEvent, global_refill_rate, global_refill_rate);
IntervalIds[product_refill_rate] = setInterval(refillEvent, product_refill_rate, product_refill_rate);

function TokenBucket(id, limit, client){
    this.Client = client;
    this.Limit = limit;
    client.set(id,limit);
    this.getToken = function(fn){
        client.get(id,function(err,reply){
        
            if(reply < 1){ return fn(false); }
            client.decr(id, fn(true));
        });
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
        }
        else{console.log('reusing existing timer for rate: ' + rate);}

}

function isRateLimited(clientid, productid, fn){
    var productidKey = clientid + productid;

    //handle global tokens
    redis.hexists(GlobalTokens,clientid,function(err,response){
        if(!response){
          redis.hset(GlobalTokens,clientid,GLOBAL_RPM,fn(err,reply)
          {   
                console.log("first time seeing " + clientid + ", setting tokens to: " + GLOBAL_RPM);
          }

          redis.hset("GlobalRateToBucketsMap","
          registerTimer("global",global_refill_rate, clientid)
          fn(null,false);
        }


    }

    //handle product tokens

    //if the bucket for this clientid doesn't exist, create it
    if(!GlobalTokens[clientid]){
        console.log('bucket for clientid \'' + clientid + '\' does not exist, creating it');
        GlobalTokens[clientid] = new TokenBucket(GLOBAL_RPM);
        //register the new bucket in the rate : buckets map
        registerBucket(global_refill_rate, GlobalTokens[clientid]);
    }
    if(!productidTokens[productidKey]){
        console.log('bucket for productidkey \'' + productidKey + '\' does not exist, creating it');
        productidTokens[productidKey] = new TokenBucket(productid_RPM);
        registerBucket(productid_refill_rate, productidTokens[productidKey]);
    }

    if(!GlobalTokens[clientid].getToken()){
        console.log('hit global limit for ' + clientid);
        return {limited:true,limittype:'global'};
    }

    if(!productidTokens[productidKey].getToken()){
        console.log('hit productid limit for ' + productidKey);
        return {limited:true,limittype:'productid'};
    }

    return {limited:false};
}

console.log('global request per minute limit is: ' + GLOBAL_RPM);
console.log('product request per minute limit is: ' + PRODUCT_RPM);
console.log('global refill rate will yield a new request every: ' + global_refill_rate + ' ms');
console.log('product refill rate will yield a new request every: ' + product_refill_rate + ' ms');


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
    res.writeHead(200, { 'Content-Type':'application/json' });
    isRateLimited(query.client,query.product,console.log,function(){
            res.end(JSON.stringify({limited:result.limited,limittype:result.limittype,client:query.client,product:query.product}));
    });
});

s.listen(8000);
