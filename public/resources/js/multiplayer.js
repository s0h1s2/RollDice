var roomId=prompt('enter room id');

var socket;

if(roomId!=null && Number.isInteger(parseInt(roomId))){
    socket=io()
}
socket.on('connect',()=>{
    socket.emit('joinroom',{ roomId:roomId });
    socket.on('fullroom',function(data){
        alert(data.message);
    });
    socket.on('waitforplayer',function(data){

    })
    socket.on('playerleave',function(){
        // alert('player is left');
    })
    /**socket.on('gamestart',function(){
        isGameStarted=true;
        alert("game is starting!");

    })**/
    

})
// socket.emit('joinroom',{ roomId:roomId });
// socket.on('gamestart',function(data){
//     console.log("game is starting");
// })