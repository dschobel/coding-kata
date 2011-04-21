function TokenBucket(size,refillRate){
    print('constructor is running');
    this.Size = this.Tokens = size;
    this.RefillRate = refillRate;
    this.Rate= 1000 / refillRate;
    this.getToken = function(){
        if(this.Tokens < 1){
            print('GetToken failed: insufficient tokens');
            return false;
        }
        this.Tokens--;
        print('GetToken succeeded, ' + this.Tokens + ' remaining');
        return true;
   };
}
