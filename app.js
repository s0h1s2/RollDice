var createError = require('http-errors');
var express = require('express');
var path = require('path');
var httpServer = require('http');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');

var app = express();

var server = httpServer.createServer(app)
var io = require('socket.io')(server);
var rooms = {};
const MAX_SECONDS=10;

function changePlayersTurn(roomId){
  if(rooms[roomId].playerturn==1){
    rooms[roomId].playerturn=0;
  }else if(rooms[roomId].playerturn==0){
    rooms[roomId].playerturn=1;
  }
}
io.on('connection', function (socket) {
  // only two player can join the game 
  socket.on('joinroom', function (data) {
    if (!rooms[data.roomId]) {
      let set = new Set();
      rooms[data.roomId] = { players: set, playerturn: 0,player1HoldPoint:0,player2HoldPoint:0,currentPoint:0,seconds:0,intervalId:0 };
      rooms[data.roomId].players.add(socket.id);
      socket.emit('waitforplayer', { message: 'please wait to other player to join!' });
    } else if (rooms[data.roomId].players.size === 1) {
      rooms[data.roomId].players.add(socket.id);
      io.to(Array.from(rooms[data.roomId].players)).emit('gamestart');
      rooms[data.roomId].intervalId=setInterval(function(){
        if(rooms[data.roomId].seconds>MAX_SECONDS){
          arrayofClient = Array.from(rooms[data.roomId].players);
          const turn=rooms[data.roomId].playerturn===0?1:0;
          if (turn === 0) {
            io.to(Array.from(rooms[data.roomId].players)).emit('ismyturn', { id: arrayofClient[0], player: 1 });
          } else if (turn === 1) {
            io.to(Array.from(rooms[data.roomId].players)).emit('ismyturn', { id: arrayofClient[1], player: 2 });
          }
          rooms[data.roomId].playerturn=turn;
          rooms[data.roomId].seconds=0;
          rooms[data.roomId].currentPoint=0;
          io.to(arrayofClient).emit('updatecurrentpoint',{ currentPoint:0 });

        }
        rooms[data.roomId].seconds++;
      },1000);
      
    } else if (rooms[data.roomId].players.size == 2) {
      socket.emit('fullroom', { message: 'room is full' });
    }
  });
  socket.on('ismyturn', function (data) {
    arrayofClient = Array.from(rooms[data.roomId].players);
    if (rooms[data.roomId].playerturn === 0) {
      io.to(Array.from(rooms[data.roomId].players)).emit('ismyturn', { id: arrayofClient[0], player: 1 });
    } else if (rooms[data.roomId].playerturn === 1) {
      io.to(Array.from(rooms[data.roomId].players)).emit('ismyturn', { id: arrayofClient[1], player: 2 });
    }
  });
  socket.on('rolldice', function (data) {
    const playerTurn=rooms[data.roomId].playerturn;
    const roomId=data.roomId;
    const playersArray = Array.from(rooms[roomId].players);
    if(socket.id==playersArray[playerTurn]){
      const dice = Math.floor(Math.random() * 6) + 1;
      if(dice==1){
        const playerTurn=rooms[data.roomId].playerturn;
        if(playerTurn===0){
          io.to(playersArray).emit('ismyturn',{ player:2 })
          rooms[data.roomId].playerturn=1;
          rooms[data.roomId].seconds=0;
        }else if(playerTurn===1){
          io.to(playersArray).emit('ismyturn',{ player:1 })
          rooms[data.roomId].playerturn=0;
          rooms[data.roomId].seconds=0;
        }
        rooms[roomId].currentPoint=0;

        io.to(playersArray).emit('updatecurrentpoint',{ currentPoint:0 });
      }else{
        rooms[roomId].currentPoint=rooms[roomId].currentPoint+dice;
        io.to(playersArray).emit('updatecurrentpoint',{ currentPoint:rooms[roomId].currentPoint });
        rooms[data.roomId].seconds=0;
      }

      io.to(playersArray).emit('rolldice', { dice: dice });
    }else{
      socket.emit('wrongclick',{ message:"You can't roll dice in other player's turn." })
    }
  });
  socket.on('hold',function(data){
    const playerTurn=rooms[data.roomId].playerturn;
    const roomId=data.roomId;
    const playersArray = Array.from(rooms[roomId].players);
    if(socket.id==playersArray[playerTurn]){
      if(playerTurn===0 && rooms[roomId].currentPoint!==0){
        rooms[roomId].player1HoldPoint=rooms[roomId].player1HoldPoint+rooms[roomId].currentPoint;
          io.to(playersArray).emit('ismyturn',{ player:2 })
          rooms[data.roomId].playerturn=1;
          io.to(playersArray).emit('updatecurrentpoint',{ currentPoint:0 });
      }else if(playerTurn===1 && rooms[roomId].currentPoint!==0){
        rooms[roomId].player2HoldPoint=rooms[roomId].player2HoldPoint+rooms[roomId].currentPoint;
        io.to(playersArray).emit('ismyturn',{ player:1 })
        rooms[data.roomId].playerturn=0;
        io.to(playersArray).emit('updatecurrentpoint',{ currentPoint:0 });
        
      }else{
        socket.emit('wrongclick',{ message:"You can't hold point when it is 0." })
      }
      rooms[roomId].currentPoint=0;
      rooms[data.roomId].seconds=0;
      io.to(playersArray).emit('updateholdpoint',{ player1:rooms[roomId].player1HoldPoint,player2:rooms[roomId].player2HoldPoint });
    }
    else{
      socket.emit('wrongclick',{ message:"You can't hold point becuase it isn't your turn." })
    }
    if(rooms[roomId].player1HoldPoint>=100){
      io.to(playersArray).emit('gameover',{ player:1 });
      clearInterval(rooms[roomId].intervalId);

      return ;
    }
    else if(rooms[roomId].player2HoldPoint>=100){
      io.to(playersArray).emit('gameover',{ player:2 });
      clearInterval(rooms[roomId].intervalId);
      return ;
    }
  });
  
  socket.on('disconnect', function () {
    for (let room in rooms) {
      if (rooms[room].players instanceof Set) {
        if (rooms[room].players.has(socket.id)) {
          const players=Array.from(rooms[room].players);
          clearInterval(rooms[room].intervalId);
          io.to(players).emit('playerleave');
          for(let i=0;i<players.length;i++){
            io.sockets.sockets.forEach(function(socket){
              if(socket.id==players[i]){
                socket.disconnect(true);
              }
            })
          }
          delete rooms[room];
          break;
        }
      }
    }
  })
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

server.listen('3000', function () {
  console.log("server is listening...");

});