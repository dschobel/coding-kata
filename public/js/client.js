 function codingkata_client(){
	 var socket = new io.Socket('localhost'); 
	 socket.connect();
	 socket.on('message', function(message){ 
		 drawData(message);
	 }) 

 }

 function drawData(data){
	 var da = $('#drawingArea');
	 da.html(data);
 }
