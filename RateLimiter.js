PRODUCT_LIMIT = 40;
GLOBAL_LIMIT = 100;

GlobalTokens = {};
ProductTokens = {};

function isRateLimited(client, product){
    var productKey = client + product;

    if(!GlobalTokens[client]{
        GlobalTokens[client] = new TokenBucket(GLOBAL_LIMIT,GLOBAL_LIMIT /60);
    }
    if(!ProductTokens[productKey]{
        ProductTokens[productKey] = new TokenBucket(PRODUCT_LIMIT,PRODUCT_LIMIT /60);
    }

    if(!GlobalTokens[client].getToken()){
        print('hit global limit');
        return true;
    }

    if(!ProductTokens[productKey].getToken()){
        print('hit product limit');
        return true;
    }

    return false;
}

