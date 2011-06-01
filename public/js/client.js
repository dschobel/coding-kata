 function codingkata_client(){
	 var socket = new io.Socket('localhost'); 
	 socket.connect();
	 socket.on('message', function(message){ 
		 drawData(message);
	 }) 

 }

 function buildBox(id,tokens,limit){
	 return '<div id = "' + id +'" class="box">'+id+'<br/>tokens: '+tokens+' / ' + limit+'</div>';
 }

 function buildHTML(id,tokens,limit){
	 return id+'<br/>tokens: '+tokens + ' / ' + limit;
 }

function drawData(data){
	var json = JSON.parse(data);

	var element = $('#'+json.id)
	var da = $('#drawingArea');

	if(element.length === 0)
	{
		da.append($(buildBox(json.id,json.tokens,json.limit)));
	}
	else
	{
		element.html(buildHTML(json.id,json.tokens,json.limit));
		element.width(json.tokens / json.limit * 100 + '%');
	}
}
