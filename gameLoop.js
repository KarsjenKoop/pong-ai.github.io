var c = document.getElementById('playfield');
var score = document.getElementById('Score');
var ctx = c.getContext("2d");

var width = c.width;
var height = c.height;
var playerWidth = 5;
var playerHeight = 40;
var timeStep = 0;
var bestTime = 0;
var iteration = 0;
var lastStateAction;
var previousTimeSteps = [];
var previous10AverageTimeSteps = [];
var epsilon = 1;
var player1 = {
  x: playerWidth,
  y: (height-playerHeight)/2,
  moveUp: false,
  moveDown: false,
  score: 0
};

localStorage.clear();

var player2 = {
  x: width - 2 * playerWidth,
  y: (height-playerHeight)/2,
  moveUp: false,
  moveDown: false,
  score: 0
};

var ball = {
  size: 4,
  x: (width - 4)/2,
  y: (height - 4)/2,
  xSpeed: Math.round(Math.random())==0?1.5:-1.5,
  ySpeed: Math.round(Math.random())==0?1.5 + 0.5 * Math.random():-1.5 - 0.5 * Math.random()
};

function resetGame(){
  resetField();
  player1.score = 0;
  player2.score = 0;
  timeStep = 0;
}

function resetField(){
  player1.y = (height-playerHeight)/2;
  player2.y = (height-playerHeight)/2;
  ball.x = (width - ball.size)/2;
  ball.y = (height - ball.size)/2;
  ball.xSpeed = Math.round(Math.random())==0?1.5:-1.5;
  ball.ySpeed = Math.round(Math.random())==0?1.5 + 0.5 * Math.random():-1.5 - 0.5 * Math.random();
}

function updatePlayer(player){
  if(player.moveDown && !player.moveUp && player.y + playerHeight < height){
    player.y = player.y + 4;
  }
  if(!player.moveDown && player.moveUp && player.y > 0){
    player.y = player.y - 4;
  }
}

function updateBall(){
  ball.x = ball.x + ball.xSpeed;
  ball.y = ball.y + ball.ySpeed;
  if(ball.y >= height - ball.size  || ball.y<=0 ){
    ball.ySpeed = ball.ySpeed * -1;
  }
  if(ball.x >= width-2*playerWidth-ball.size && ball.x <= width-playerWidth-ball.size && ball.y<=player2.y+playerHeight && ball.y+ball.size>=player2.y){
    ball.xSpeed = ball.xSpeed * -1;
    var increase = (ball.y+ball.size/2-(player2.y+playerHeight/2))/(playerHeight/2);
    increase = increase * increase;
    ball.ySpeed = ball.ySpeed < 0? ball.ySpeed-increase: ball.ySpeed+increase;
  }
  if(ball.x <= 2*playerWidth && ball.x >= playerWidth && ball.y<=player1.y+playerHeight && ball.y+ball.size>=player1.y){
    ball.xSpeed = ball.xSpeed * -1;
    var increase = (ball.y+ball.size/2-(player1.y+playerHeight/2))/(playerHeight/2);
    increase = increase * increase;
    ball.ySpeed = ball.ySpeed < 0? ball.ySpeed-increase: ball.ySpeed+increase;
  }
  if(ball.x >= width){
    player1.score = player1.score +1;
    resetField();
  }
  if(ball.x <= 0){
    player2.score = player2.score +1;
    resetField();
  }
}

function mainLoop(){
  ctx.fillRect(0,0,width,height);
  ctx.clearRect(player1.x, player1.y, playerWidth, playerHeight);
  ctx.clearRect(player2.x, player2.y, playerWidth, playerHeight);
  ctx.clearRect(ball.x, ball.y, ball.size, ball.size);
  updateBall();
  updatePlayer(player1);
  updatePlayer(player2);
  updateAI(ball.x+ball.size/2, ball.y+ball.size/2, player2.x+playerWidth/2, player2.y+playerHeight/2, player2.score, player1.score, timeStep, player2, false);
  updateAI(ball.x+ball.size/2, ball.y+ball.size/2, player1.x+playerWidth/2, player1.y+playerHeight/2, player1.score, player2.score, timeStep, player1, true);
  timeStep = timeStep + 1;
  score.innerHTML = player1.score + ":" + player2.score;
  document.getElementById('epsilon').innerHTML = "epsilon:"+epsilon;
  document.getElementById('lastState').innerHTML = "lastStateAction:"+lastStateAction;
  document.getElementById('storageLength').innerHTML = "storageLength:"+localStorage.length;
  var data = "";
  for(var i=0;i<localStorage.length;i++){
    data = data + localStorage.key(i)+":"+ localStorage.getItem(localStorage.key(i))+"<br>";
  }
  document.getElementById('stored').innerHTML = data;
  data = "Iteration averages:<br>";
  for(var i=0;i<previous10AverageTimeSteps.length;i++){
    data = data + previous10AverageTimeSteps[i]+"<br>";
  }
  document.getElementById('iterationAverage').innerHTML = data;
}
function addKey(e){
  if(e.key == "ArrowDown"){
    player1.moveDown = true;
  }
  if(e.key == "ArrowUp"){
    player1.moveUp = true;
  }
  /*if(e.key == "s"){
    player2.moveDown = true;
  }
  if(e.key == "w"){
    player2.moveUp = true;
  }*/
}
function removeKey(e){
  if(e.key == "ArrowDown"){
    player1.moveDown = false;
  }
  if(e.key == "ArrowUp"){
    player1.moveUp = false;
  }
  /*if(e.key == "s"){
    player2.moveDown = false;
  }
  if(e.key == "w"){
    player2.moveUp = false;
  }*/
}

function updateBasicAI(ballX, ballY, ownX, ownY, ownScore, enemyScore, timeStep, player){
  if(ballY-5<ownY){
    player.moveUp = true;
  }
  if(ballY+5>ownY){
    player.moveDown = true;
  }
}

function maxQValue(qValueUp, qValueNothing, qValueDown){
  if(qValueUp>qValueNothing && qValueUp>qValueNothing){
    return qValueUp;
  }
  if(qValueNothing>qValueUp && qValueNothing>qValueDown){
    return qValueNothing;
  }
  return qValueDown;
}

function chooseNextAction(currentState, qValueUp, qValueNothing, qValueDown, player){
  if(Math.random()<=epsilon){
    var decision = Math.random();
    if(decision<1.0/3.0){
      lastStateAction = currentState+",1";
      player.moveUp = true;
    }else if(decision<2.0/3.0){
      lastStateAction = currentState+",0";
    }else{
      lastStateAction = currentState+",-1";
      player.moveDown = true;
    }
  }else{
    if(qValueUp>qValueNothing && qValueUp>qValueNothing){
      lastStateAction = currentState+",1";
      player.moveUp = true;
      return;
    }
    if(qValueDown>qValueUp && qValueDown>qValueNothing){
      lastStateAction = currentState+",-1";
      player.moveDown = true;
      return;
    }
    lastStateAction = currentState+",0";
  }
  epsilon = epsilon/1.0001;
}

function updateAdvancedAI(ballX, ballY, ownX, ownY, ownScore, enemyScore, timeStep, player){
  //Here could be your AI
  //To moveUp set player.moveUp = true and to move down set player.moveDown = true
  var currentState = /*Math.round(ballX)+","+Math.round(ballY)+","+ownY;*/Math.round(ballY)-ownY<-playerHeight/2?-1:Math.round(ballY)-ownY>playerHeight/2?1:0;
  var qValueUp = Number(localStorage.getItem(currentState+",1"));
  var qValueNothing = Number(localStorage.getItem(currentState+",0"));
  var qValueDown = Number(localStorage.getItem(currentState+",-1"));
  if(qValueUp == undefined || qValueUp == null){
    qValueUp = 0;//Math.random();
    qValueNothing = 0;//Math.random();
    qValueDown = 0;//Math.random();
    localStorage.setItem(currentState+",1", Math.round(qValueUp*1000)/1000);
    localStorage.setItem(currentState+",0", Math.round(qValueNothing*1000)/1000);
    localStorage.setItem(currentState+",-1", Math.round(qValueDown*1000)/1000);
  }
  var reward;
  if(lastStateAction != undefined){
    var qValue = Number(localStorage.getItem(lastStateAction));
    reward = ball.x >= width-2*playerWidth-ball.size && ball.x <= width-playerWidth-ball.size && ball.y<=player2.y+playerHeight && ball.y+ball.size>=player2.y?1+qValue:qValue;
    reward = enemyScore>0?-0.1+qValue:reward;
    qValue = qValue + 1*(reward + 0 * maxQValue(qValueUp, qValueNothing, qValueDown) - qValue);
    localStorage.setItem(lastStateAction, Math.round(qValue*1000.0)/1000.0);
  }
  if(enemyScore>0){
    //localStorage.setItem("I"+iteration,""+timeStep);
    previousTimeSteps[previousTimeSteps.length] = timeStep;
    if(previousTimeSteps.length%10==0){
      var average = 0;
      for(var i=1;i<=10;i++){
          average += previousTimeSteps[previousTimeSteps.length-i];
      }
      previous10AverageTimeSteps.push(average/10);
    }
    if(timeStep>bestTime){
      bestTime = timeStep;
    }
    document.getElementById('iteration').innerHTML = "iteration:"+iteration;
    document.getElementById('bestTime').innerHTML = "bestTime:"+bestTime;
    iteration +=1;
    resetGame();
    return;
  }
  chooseNextAction(currentState, qValueUp, qValueNothing, qValueDown, player);
}

function updateAI(ballX, ballY, ownX, ownY, ownScore, enemyScore, timeStep, player, basic){
  player.moveUp = false;
  player.moveDown = false;
  if(basic){
    updateBasicAI(ballX, ballY, ownX, ownY, ownScore, enemyScore, timeStep, player);
  }else{
    updateAdvancedAI(ballX, ballY, ownX, ownY, ownScore, enemyScore, timeStep, player);
  }
}
