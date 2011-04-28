http = require('http')
#cluster = require('cluster')
url = require('url')

PRODUCT_RPM = 40
GLOBAL_RPM = 100
global_refill_rate = Math.round(GLOBAL_RPM /0.06)#convert to ms
product_refill_rate = Math.round(PRODUCT_RPM/0.06)

GlobalTokens = {}
ProductTokens = {}
RateToBucketsMap = {}
IntervalIds ={}
class TokenBucket
    constructor : (@limit) ->
        @tokens = @limit

    getToken:  () ->
        if @tokens < 1
            return false
        @tokens--
        return true
   
refillEvent = (rate) ->
    for bucket in RateToBucketsMap[rate]
        #ToDo: cleanup full token buckets
        bucket.tokens = Math.min bucket.limit, bucket.tokens+1

registerBucket = (rate,bucket) ->
        #if the map of timers doesn't have an instance for this rate, create it
        if !RateToBucketsMap[rate]
            console.log "first bucket at rate #{rate}, creating new entry in rate map"
            RateToBucketsMap[rate] = [bucket]
        
        else
            console.log "associating bucket in the existing rate entry for  #{rate}"
            RateToBucketsMap[rate].push bucket
        

        if !IntervalIds[rate]
            console.log "bucket map does not contain a timer for rate:  #{rate}"
            IntervalIds[rate] = setInterval refillEvent,rate,rate
        
        else
            console.log "reusing existing timer for rate:  #{ rate }"


isRateLimited = (client, product) ->
    productKey = client + product
    #if the bucket for this client doesn't exist, create it
    if !GlobalTokens[client]
        console.log "bucket for client #{client} does not exist, creating it"
        GlobalTokens[client] = new TokenBucket(GLOBAL_RPM)
        #register the new bucket in the rate : buckets map
        registerBucket(global_refill_rate, GlobalTokens[client])
    
    if !ProductTokens[productKey]
        console.log "bucket for productkey #{productKey} does not exist, creating it"
        ProductTokens[productKey] = new TokenBucket(PRODUCT_RPM)
        registerBucket(product_refill_rate, ProductTokens[productKey])
    

    if !GlobalTokens[client].getToken()
        console.log "hit global limit for #{client}"
        return {limited:true,limittype:'global'}
    

    if !ProductTokens[productKey].getToken()
        console.log "hit product limit for #{productKey}"
        return {limited:true,limittype:'product'}

    return {limited:false}

console.log "global request per minute limit is: #{ GLOBAL_RPM}"
console.log "product request per minute limit is: #{ PRODUCT_RPM}"
console.log "global refill rate will yield a new request every:  #{ global_refill_rate }  ms"
console.log "product refill rate will yield a new request every: #{ product_refill_rate } ms"


FAIL_MESSAGE = "missing client and/or product parameters\n"
s = http.createServer(
    (req,res) ->
        query = url.parse(req.url, true).query
        if !query.client || !query.product
            res.writeHead 400,
            {
                "Content-Length": FAIL_MESSAGE.length,
                "Content-Type":"text/plain"
            }
            res.end FAIL_MESSAGE
            return
        res.writeHead 200, { "Content-Type":"application/json" }
        
        result = isRateLimited query.client, query.product
        if result.limited
            response = JSON.stringify {limited:true,limittype:result.limittype,client:query.client, product:query.product}
            res.end response
        else
            response = JSON.stringify {limited:false,limittype:result.limittype,client:query.client,product:query.product}
            res.end response
)

s.listen 8000
