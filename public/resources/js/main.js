"use strict";

// html varibles
// player 1
const player1 = document.querySelector(".player-1");
const player1Name = document.querySelector(".player-1__name");
const player1HoldPoint = document.querySelector(".player-1__holdPoint--value");
const player1CurrentPoint = document.querySelector(
  ".player-1__currentPoint--value"
);

// player 2
const player2 = document.querySelector(".player-2");
const player2Name = document.querySelector(".player-2__name");
const player2HoldPoint = document.querySelector(".player-2__holdPoint--value");
const player2CurrentPoint = document.querySelector(
  ".player-2__currentPoint--value"
);

// general
const dice = document.querySelector(".dice");
const newGameBtn = document.querySelector(".newGameBtn");
const rollDiceBtn = document.querySelector(".rollDiceBtn");
const holdBtn = document.querySelector(".holdBtn");

// js functions
socket.on('gamestart', function (data) {
  socket.emit('ismyturn', { roomId: roomId });
});
socket.on('ismyturn', function (data) {
  if (data.player == 1) {
    document.querySelector('.player-2').classList.remove("active");
    document.querySelector('.player-1').classList.add("active");
  } else if (data.player == 2) {
    document.querySelector('.player-1').classList.remove("active");
    document.querySelector('.player-2').classList.add("active");
  }
})
// event listner functions

// roll btn function
socket.on('rolldice', function (data) {
  const score = data.dice;
  dice.className = "dice";
  if (score == 1) {
    dice.classList.add("one");
  } else if (score == 2) {
    dice.classList.add("two");
  } else if (score == 3) {
    dice.classList.add("three");
  } else if (score == 4) {
    dice.classList.add("four");
  } else if (score == 5) {
    dice.classList.add("five");
  } else if (score == 6) {
    dice.classList.add("six");
  }

});
socket.on('wrongclick', function (data) {
  alert(data.message);
});
socket.on('gameover',function(data){
  alert(data.message);

})
socket.on('updatecurrentpoint', function (data) {
  console.log(data);
  
  const active = document.querySelector('.active .currentPoint--value');
  active.textContent = data.currentPoint;
})
socket.on('updateholdpoint', function (data) {
  document.querySelector('#player1-holdpoint').textContent = data.player1 === 0 ? 0 : data.player1;
  document.querySelector('#player2-holdpoint').textContent = data.player1 === 0 ? 0 : data.player2;
})
const rollDiceEvent = function () {
  socket.emit('rolldice', { roomId: roomId });
}

// hold btn function
const hold = function () {
  socket.emit('hold', { roomId: roomId });
  // socket.emit('gameover',{ roomId:roomId });
}

// new game btn function
const newGame = function () {
  location.reload();
};
// event runer function
function eventRunner() {
  rollDiceBtn.addEventListener("click", rollDiceEvent);
  holdBtn.addEventListener("click", hold);
  newGameBtn.addEventListener("click", newGame);
}
eventRunner();
