 function codingkata_client(){
	 var socket = new io.Socket('localhost'); 
	 socket.connect();
	 socket.on('message', function(message){ 
		 drawData(message);
	 }) 

 }

 function buildBox(id,tokens){
	 return '<div id = "' + id +'" class="box">'+id+'<br/>tokens: '+tokens+'</div>';
 }

 function buildHTML(id,tokens){
	 return id+'<br/>tokens: '+tokens;
 }

function drawData(data){
	var json = JSON.parse(data);
	var productid = json.client+json.product;
	var clientid = json.client;

	var productEl = $('#'+ productid)
	var clientEl = $('#'+clientid)
	var da = $('#drawingArea');

	if(productEl.length === 0)
	{
		da.append($(buildBox(productid,json.producttokens)));
	}
	else
	{
		productEl.html(buildHTML(productid,json.producttokens));
	}

	if(clientEl.length === 0)
	{
		da.append($(buildBox(clientid,json.globaltokens)));
	}
	else
	{
		clientEl.html(buildHTML(clientid,json.globaltokens));
	}
	//da.html(data);
}
