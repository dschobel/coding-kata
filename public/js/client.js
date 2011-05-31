 var socket = new io.Socket('localhost'); 
 socket.connect();
 socket.on('connect', function(){ 
	 alert('sending message');
	 socket.send('hello from the clientside!');
	 }) 
 socket.on('message', function(message){ alert(message);  }) 
 socket.on('disconnect', function(){  }) 
