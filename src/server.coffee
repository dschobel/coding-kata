http = require('http')
url = require('url')
io = require('socket.io');
express = require('express');


PRODUCT_RPM = 75
GLOBAL_RPM = 100
global_refill_rate = Math.round(GLOBAL_RPM /0.06)#convert to ms
product_refill_rate = Math.round(PRODUCT_RPM/0.06)

FAIL_MESSAGE = "missing client and/or product parameters\n"
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
        return {limited:true, limittype:'global', globaltokens:GlobalTokens[client].tokens, producttokens:ProductTokens[productKey].tokens}
    

    if !ProductTokens[productKey].getToken()
        console.log "hit product limit for #{productKey}"
        return {limited:true, limittype:'product', globaltokens:GlobalTokens[client].tokens, producttokens:ProductTokens[productKey].tokens}

    return {limited:false, limittype:'none', globaltokens:GlobalTokens[client].tokens, producttokens:ProductTokens[productKey].tokens}


console.log "global request per minute limit is: #{ GLOBAL_RPM}"
console.log "product request per minute limit is: #{ PRODUCT_RPM}"
console.log "global refill rate will yield a new request every:  #{ global_refill_rate }  ms"
console.log "product refill rate will yield a new request every: #{ product_refill_rate } ms"

app = express.createServer()
console.log 'created express server'
app.configure(-> app.use(express.static(__dirname + "../../public")))


app.get '/limiter', (req, res)->
			query = url.parse(req.url, true).query
			if !query.client || !query.product
				res.writeHead 400,
				{
					"Content-Length": FAIL_MESSAGE.length,
					"Content-Type":"text/plain"
				}
				res.end FAIL_MESSAGE
				return
			res.writeHead(200, { "Content-Type":"application/json" })
			result = isRateLimited query.client, query.product
			response = {limited:result.limited, limittype:result.limittype, client:query.client, product:query.product, globaltokens:result.globaltokens, producttokens:result.producttokens}
			res.end JSON.stringify response
			message_all_clients response

message_all_clients = (message) ->
									for socket in sockets
										socket.send(message)


sockets = []

websocket = io.listen(app)
websocket.on('connection', (socket) ->
							sockets.push socket
							console.log sockets.length + ' clients now connected'
							socket.on 'disconnect', ->
								 idx = sockets.indexOf(socket) 
								 sockets.splice(idx, 1) unless idx == -1
								 console.log sockets.length + ' clients now connected'
						)
app.listen 8000
