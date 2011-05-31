

 function codingkata_client(){
	 var socket = new io.Socket('localhost'); 
	 socket.connect();
	 //socket.on('connect', function(){ alert('connected'); }) 
	 socket.on('message', function(message){ 
		 drawData(message);
	 }) 
	 //socket.on('disconnect', function(){ alert('disconnected') }) 

 }

 function drawData(data){
	 var da = $('#drawingArea');
	 da.html('jquery works: ' + data);
 }
