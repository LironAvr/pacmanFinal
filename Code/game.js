/**
 * Created by lirona on 06/05/2017.
 */

var sound = "Sounds/music.mp3";
var gameMusic;

var ghosts = [];
var corners = [{x : 30, y : 30} , { x : 410, y : 30 }, { x : 410, y : 390 }, { x: 30 , y : 390}];
var ghostPicture = "Images/ghost.png";
var poisonPicture = "Images/poison.png";
var confusePicture = "Images/poop.png";
var bonusPicture = "Images/bonus.png";
var speedPicture = "Images/speed.png";

var _cellSize = 20;
var _baseSpeed = 5;
var pacman;
var _ghostsAmount;
var _movingBonus;
var _coins;
var intervalId;
var _canvas;
var _myCanvas;
var _coinsAmount;
var curse;
var _points;
var intervalSize = 45;
var counterToOneSecond;
var _timeLeft;
var lives;
var startGame = true;
var pacmanDied = false;

var _bonuses = [];
var freeze;
var poison;
var speed;
var fastMode;
var fastModeSecondsCounter;
var moves = {
    37 : function(figure) { figure.x -= figure.speed; }, //left
    38 : function(figure) { figure.y -= figure.speed; }, //up
    39 : function(figure) { figure.x += figure.speed; }, //right
    40 : function(figure) { figure.y += figure.speed; }  // down
}

function initPacman() {
    pacmanDied=false;
    pacman = {
        x : 50,
        y : 30,
        radius : 10,
        speed : _baseSpeed,
        currentDirection : 37,
        previousDirection : 37,
        nextDirection: 0,
        startingX : 50,
        startingY : 30
    };
    var location;
    do location = getRandomEmptyCell()
    while (location[0] > 12 || location[1] > 12);
    pacman.x = location[1] * _cellSize + pacman.radius;
    pacman.y = location[0] * _cellSize + pacman.radius;
}

function initGhosts() {
    _ghostsAmount = $("#ghostsNum").val();
    for (var i = 0; i < _ghostsAmount; i++)
    {
        if (ghosts[i] == null) {
            var ghost = {
                x: corners[i + 1].x,
                y: corners[i + 1].y,
                prevX: 0,
                prevY: 0,
                radius: 10,
                color: 'white',
                direction: 37,
                speed: _baseSpeed,
                startingX: corners[i + 1].x,
                startingY: corners[i + 1].y,
                imagePath: ghostPicture
            };
            ghost.oldStart = { x : -1, y : -1 };
            ghost.oldGoal =  { x : -1, y : -1 };
            ghost.ghostsBoard = arrayCopy(ghostsBoard);
            ghosts.push(ghost);
        }
    }
}

function initMovingBonus() {
    _movingBonus = {
        x : 390,
        y : 30,
        radius : 10,
        imagePath: bonusPicture,
        direction: 39,
        speed: _baseSpeed,
        cost : 50
    };
}

function initCoins() {
    _coinsAmount = $("#coinsNum").val();
    _coins = [];
    var high = Math.ceil( _coinsAmount * 0.1 );
    var med = Math.floor( _coinsAmount * 0.3 );
    var low = _coinsAmount - high - med;

    for (var i = 0; i < high; i++) {
        _coins.push(createCoin(25));
    };
    for (var i = 0; i < med; i++) {
        _coins.push(createCoin(15));
    };
    for (var i = 0; i < low; i++) {
        _coins.push(createCoin(5));
    };
}

function init(){
    initPacman();
    initGhosts();
    initMovingBonus();
    initCoins();
    _timeLeft = $("#timeToPlay").val();
    _points = 0;
    _canvas = document.getElementById("myCanvas");
    _myCanvas = _canvas.getContext("2d");
    window.addEventListener("keydown", function(){
        if (event.keyCode >= 37 & event.keyCode <= 40) //Handles user arrow key clicks
        {
            pacman.nextDirection = event.keyCode;
        }
    });
    initSpeedyBonus();
    initFreeze();
    initPoison();
    counterToOneSecond = 0;
    lives = 3;
    startGame = false;
    fastMode = false;
    playSound(sound);
}

function getRandomEmptyCell()
{
    var y;
    var x;
    do {
        y = Math.floor((Math.random() * 20));
        x = Math.floor((Math.random() * 22));
    }
    while (null == board[y] || board[y][x] != 0);
    return [y, x];
}


function locateBonus(bonusNumber)
{
    var location = getRandomEmptyCell();
    board[location[0]][location[1]] = bonusNumber;
    return {
        x : location[1] * _cellSize,
        y : location[0] * _cellSize,
        radius : 10,
        visible : true
    };
}

function createCoin(bonus){
    var location = getRandomEmptyCell();
    board[location[0]][location[1]] = 2;
    var coin = {
        y : location[0] * _cellSize + 10,
        x : location[1] * _cellSize + 10,
        radius : 6,
        color : getColorCoin(bonus),
        cost : bonus};
    return coin;
}

function getColorCoin(bonus){
    if (bonus == 25) return "yellow";
    if (bonus == 15) return "silver";
    if (bonus == 5) return "orange";
}

function checkBonusesCollision()
{
    for (var i = 0; i < _bonuses.length; i++)
    {
        var bonus = _bonuses[i];
        if (bonus != null)
        {
            if (checkCollision(pacman, bonus))
            {
                bonus.doMagic();
                bonus = null;
                _bonuses[i] = null;
            }
        }
    }
}

function initPoison(){
    poison = locateBonus(4, poison);
    poison.imagePath = poisonPicture;
    poison.doMagic = function() { diePacmanDie(1); }
    _bonuses.push(poison);
}

function initFreeze(){
    curse = locateBonus(4, curse);
    curse.imagePath = confusePicture;
    curse.doMagic = function() {
        freeze = 70;
        curse = null;
    }
    _bonuses.push(curse);
}

function initSpeedyBonus()
{
    speed = locateBonus(5);
    speed.imagePath = speedPicture;
    speed.doMagic = function() {
        fastMode = true;
        pacman.speed = _baseSpeed * 2;
        startSpeedTime = _timeLeft;
    }
    fastModeSecondsCounter = 0;
    _bonuses.push(speed);
}

function printBonuses(){
    for (var i = 0; i < _bonuses.length; i++)
    {
        var bonus = _bonuses[i];
        if (bonus != null && bonus.visible == true)
        {
            printPicture(bonus);
        }
    }
}

function checkSpeed()
{
    if (fastModeSecondsCounter * intervalSize < 6000)
    {
        pacman.speed = _baseSpeed * 2;
        fastModeSecondsCounter++;
    } else {
        pacman.speed = _baseSpeed;
        while (pacman.x % _cellSize != 10) { pacman.x -= 1;}
        while (pacman.y % _cellSize != 10) { pacman.y -= 1;}
        speed = null;
        fastMode = false;
    }
}

function printBoard() {
    for (var row = 0; row < board.length; row++)
    {
        for (var col=0; col < board[row].length; col++)
        {
            if(board[row][col]==1)
            {
                _myCanvas.fillStyle="blue";
                _myCanvas.fillRect(col * _cellSize, row * _cellSize, _cellSize, _cellSize);
            } else {
                _myCanvas.fillStyle="black";
                _myCanvas.fillRect(col * _cellSize, row * _cellSize, _cellSize, _cellSize);
            }
        }
    }
}

function movePacman()
{
    if (freeze > 0){
        freeze--;
        return;
    }
    if (possibleStep(pacman.currentDirection, pacman) == false || possibleStep(pacman.nextDirection, pacman))
    {
        if (pacman.currentDirection != 0)
        {
            pacman.previousDirection = pacman.currentDirection;
        }
        pacman.currentDirection = pacman.nextDirection;
        pacman.nextDirection = 0;
    }

    if (possibleStep(pacman.currentDirection, pacman))
    {
        moves[pacman.currentDirection](pacman);
    }
}

function possibleStep(direction, figure)
{
    var xCord;
    var yCord;

    switch (direction){
        case 0:{
            return false;
            break;
        }
        case 37:{
            xCord =(figure.x - figure.radius - figure.speed) / _cellSize;
            xCord = Math.floor(xCord);

            if (figure.x - figure.radius < 1)
            {
                figure.x = _canvas.width - 14;
                return;
            }

            yCord = (figure.y - figure.radius) / _cellSize;
            yCord = Math.floor(yCord);
            if (board[yCord][xCord] == 1) return false;

            yCord = (figure.y - figure.radius) / _cellSize;
            yCord = Math.ceil(yCord);
            if (board[yCord][xCord] == 1) return false;
            break;
        }
        case 38:{
            yCord =(figure.y - figure.radius - figure.speed) / _cellSize;
            yCord = Math.floor(yCord);

            xCord = (figure.x - figure.radius) / _cellSize;
            xCord = Math.floor(xCord);
            if (board[yCord][xCord] == 1)  return false;

            xCord = (figure.x - figure.radius) / _cellSize;
            xCord = Math.ceil(xCord);
            if (board[yCord][xCord] == 1)  return false;
            break;
        }
        case 39:{
            xCord =(figure.x+figure.radius) / _cellSize;
            xCord = Math.floor(xCord);

            if (figure.x + figure.radius > _canvas.width - 1)
            {
                figure.x = 10;
                return;
            }

            yCord = (figure.y - figure.radius) / _cellSize;
            yCord = Math.floor(yCord);
            if (board[yCord][xCord] == 1) return false;

            yCord = (figure.y - figure.radius) / _cellSize;
            yCord = Math.ceil(yCord);
            if (board[yCord][xCord] == 1) return false;
            break;
        }
        case 40:{
            yCord =(figure.y+figure.radius) / _cellSize;
            yCord = Math.floor(yCord);

            xCord = (figure.x - figure.radius) / _cellSize;
            xCord = Math.floor(xCord);
            if (board[yCord][xCord] == 1)  return false;

            xCord = (figure.x + figure.radius-1) / _cellSize;
            xCord = Math.floor(xCord);
            if (board[yCord][xCord] == 1)  return false;
            break;
        }
    }

    if (board[yCord][xCord] == 0 || board[yCord][xCord] > 1) { return true; }
    else { return false; }
}

function printPacman(){
    if (pacman.currentDirection == 39 || (pacman.currentDirection == 0 && pacman.previousDirection == 39))
    {
        printPacmanRightLeft("right");
        return;
    }

    if (pacman.currentDirection == 37 || (pacman.currentDirection == 0 && pacman.previousDirection == 37))
    {
        printPacmanRightLeft("left");
        return;
    }

    if (pacman.currentDirection == 38 || (pacman.currentDirection == 0 && pacman.previousDirection == 38))
    {
        printPacmanUpDown("up");
        return;
    }

    if (pacman.currentDirection == 40 || (pacman.currentDirection == 0 && pacman.previousDirection == 40))
    {
        printPacmanUpDown("down");
        return;
    }
}

function printPacmanRightLeft(leftRight)
{
    var notClockWise = leftRight == "left";
    _myCanvas.beginPath();
    _myCanvas.arc(pacman.x, pacman.y, pacman.radius, 0.25 * Math.PI, 1.25 * Math.PI, notClockWise);
    _myCanvas.fillStyle = "rgb(255, 255, 0)";
    _myCanvas.fill();
    _myCanvas.beginPath();
    _myCanvas.arc(pacman.x, pacman.y, pacman.radius, 0.75 * Math.PI, 1.75 * Math.PI, notClockWise);
    _myCanvas.fill();
    _myCanvas.beginPath();
    _myCanvas.arc(pacman.x, pacman.y-6, pacman.radius/5, 0, 2 * Math.PI, false);
    _myCanvas.fillStyle = "rgb(0, 0, 0)";
    _myCanvas.fill();
}

function printPacmanUpDown(upDown)
{
    var notClockWise = upDown == "up";
    _myCanvas.beginPath();
    _myCanvas.arc(pacman.x, pacman.y, pacman.radius, 1.25 * Math.PI, 0.25 * Math.PI, notClockWise);
    _myCanvas.fillStyle = "rgb(255, 255, 0)";
    _myCanvas.fill();
    _myCanvas.beginPath();
    _myCanvas.arc(pacman.x, pacman.y, pacman.radius, 0.75 * Math.PI, 1.75 * Math.PI, notClockWise);
    _myCanvas.fill();
    _myCanvas.beginPath();
    if (upDown == "up")
    {
        _myCanvas.arc(pacman.x-6, pacman.y-1, pacman.radius/5, 0, 2 * Math.PI);
        _myCanvas.fillStyle = "rgb(0, 0, 0)";
    } else {
        _myCanvas.arc(pacman.x-6, pacman.y, pacman.radius/5, 0, 2 * Math.PI);
        _myCanvas.fillStyle = "rgb(0, 0, 0)";
    }

    _myCanvas.fill();
}

function printCoin(){
    for (var i= 0; i < _coins.length; i++)
    {
        var coinToPrint = _coins[i];
        _myCanvas.beginPath();
        _myCanvas.arc(coinToPrint.x, coinToPrint.y, coinToPrint.radius, 0, 2 * Math.PI, false);
        _myCanvas.fillStyle = coinToPrint.color;
        _myCanvas.fill();

        _myCanvas.font = "8px Arial";
        _myCanvas.fillStyle="black"
        if (coinToPrint.cost == 5){
            _myCanvas.fillText(coinToPrint.cost.toString() ,coinToPrint.x-coinToPrint.radius*0.4, coinToPrint.y+coinToPrint.radius*0.5);
        } else{
            _myCanvas.fillText(coinToPrint.cost.toString() ,coinToPrint.x-coinToPrint.radius*0.75, coinToPrint.y+coinToPrint.radius*0.5);
        }
    }
}

function printGhosts(){
    for(var i = 0; i < _ghostsAmount; i++)
    {
        var ghost = ghosts[i];
        var imageObj = new Image();
        imageObj.width = "20px";
        imageObj.height = "20px";
        imageObj.src = ghost.imagePath;
        _myCanvas.drawImage(imageObj, ghost.x - ghost.radius, ghost.y - ghost.radius , _cellSize, _cellSize);
    }
}

function checkGhostsCollision()
{
    for (var i = 0; i < _ghostsAmount; i++)
    {
        if (checkCollision(pacman,ghosts[i]))
        {
            diePacmanDie(2);
        }
    }
}

function diePacmanDie(type){
    clearInterval(intervalId);
    lives--;
    var msg = "Run Pacman, Run!";
    pacmanDied = true;
    _myCanvas.font = "30px Arial";
    _myCanvas.fillStyle="white"
    if (1 == type) msg = "Wrong thing to eat!";
    _myCanvas.fillText(msg ,100, 100);
    setTimeout(function() {
        if (lives != 0)
        {
            startPlaying();
        } else {
            Game();
        }
    }, 1500);
}

function checkCollision(figureA, figureB)
{
    if ((figureA.x <= (figureB.x + figureB.radius)
        && figureB.x <= (figureA.x + figureA.radius)
        && figureA.y <= (figureB.y + figureB.radius)
        && figureB.y <= (figureA.y + figureA.radius)))
    {
        return true;
    } else {
        return false;
    }
}


function checkCoinsCollision(){
    document.getElementById("userPoints").innerHTML = "Points : " + _points;
    if (_coins.length != 0)
    {
        for (var i=0; i < _coins.length; i++)
        {
            var coin = _coins[i];
            if (checkCollision(pacman, coin))
            {
                _points += coin.cost;
                _coins.splice(i,1);
                _coinsAmount--;
            }
        }
    }
}

function moveGhosts()
{
    for (var i = 0; i < _ghostsAmount; i++)
    {
        ghosts[i].direction = getBestMoveForGhost(ghosts[i]);
        ghosts[i].prevX = ghosts[i].x;
        ghosts[i].prevY = ghosts[i].y;
        moves[ghosts[i].direction](ghosts[i]);
    }
}

function move_movingBonus() {
    if (_movingBonus.x < 0) {
        _movingBonus.x = _canvas.width - 10;
        return;
    }

    if (_movingBonus.x > _canvas.width - 1) {
        _movingBonus.x = 10;
        return;
    }

    if (possibleStep(_movingBonus.direction, _movingBonus)) {
        moves[_movingBonus.direction](_movingBonus);
    }

    var possibleMoves = getPossibleMoves(_movingBonus);
    if (possibleMoves.length >= 3) {
        var randDirection = Math.floor((Math.random() * possibleMoves.length));
        _movingBonus.direction = possibleMoves[randDirection];
    } else if (possibleMoves.length == 2) {
        _movingBonus.direction = getNewDirection(_movingBonus);
    }
}

function print_movingBonus() {
    var imageObj = new Image();
    imageObj.width = "20px";
    imageObj.height = "20px";
    imageObj.src = _movingBonus.imagePath;
    _myCanvas.drawImage(imageObj, _movingBonus.x - _movingBonus.radius, _movingBonus.y - _movingBonus.radius, _cellSize, _cellSize);
}

function getPossibleMoves(figure) {
    var res = [];
    if (possibleStep(37, figure) == true) {
        res.push(37);
    } // left

    if (possibleStep(38, figure) == true) {
        res.push(38);
    } // up

    if (possibleStep(39, figure) == true) {
        res.push(39);
    } // right

    if (possibleStep(40, figure) == true) {
        res.push(40);
    } // down

    return res;
}

function getNewDirection(ghostFigure) {
    if (ghostFigure.direction == 37) //left
    {
        if (possibleStep(38, ghostFigure) == true) return 38;
        if (possibleStep(40, ghostFigure) == true) return 40;
        if (possibleStep(37, ghostFigure) == true) return 37;
    }

    if (ghostFigure.direction == 38) //up
    {
        if (possibleStep(37, ghostFigure) == true) return 37;
        if (possibleStep(39, ghostFigure) == true) return 39;
        if (possibleStep(38, ghostFigure) == true) return 38;
    }

    if (ghostFigure.direction == 40) // down
    {
        if (possibleStep(37, ghostFigure) == true) return 37;
        if (possibleStep(39, ghostFigure) == true) return 39;
        if (possibleStep(40, ghostFigure) == true) return 40;
    }

    if (ghostFigure.direction == 39) // right
    {
        if (possibleStep(38, ghostFigure) == true) return 38;
        if (possibleStep(40, ghostFigure) == true) return 40;
        if (possibleStep(39, ghostFigure) == true) return 39;
    }
}

function Game() //Game Logic Loop
{
    movePacman();
    checkCoinsCollision();
    moveGhosts();
    draw();
    checkCoins();
    if (_movingBonus != null) {
        move_movingBonus();
        check_movingBonusCollision();
    }
    if (lives == 0) {
        clearInterval(intervalId);
        endGame();
        return;
    }
    if (fastMode) {
        checkSpeed();
    }

    checkBonusesCollision();
    checkGhostsCollision();
    handelTimer();
}

function drawLives() {
    $("#lives").html("");
    for (var i = 0; i < 3; i++) {
        if(i < lives)
            $("#lives").prepend('<img src="./images/heart.png" style="width:10px; height:10px; margin-left:2px;" />');
        else
            $("#lives").prepend('<img src="./images/Broken_Heart.png" style="width:10px; height:10px; margin-left:2px;" />');
    }
}

function draw() {
    _myCanvas.clearRect(0, 0, _canvas.width, _canvas.height);
    printBoard();
    printPacman();
    printCoin();
    printGhosts();
    if (_movingBonus != null) {
        print_movingBonus();
    }
    printBonuses();
    drawLives();
}

function check_movingBonusCollision() {
    if (checkCollision(pacman, _movingBonus)) {
        _points += _movingBonus.cost;
        _movingBonus = null;
    }
}

function checkCoins() {
    if (_coinsAmount == 0) {
        endGame();
    }
}

function handelTimer() {
    ++counterToOneSecond;
    if (intervalSize * counterToOneSecond > 1000) {
        _timeLeft--;
        counterToOneSecond = 0;
    }
    document.getElementById("timeLeft").innerHTML = "Time left: " + _timeLeft;
    if (_timeLeft == 0) {
        endGame();
    }
}

function resetPacman() {
    pacman.x = pacman.startingX;
    pacman.y = pacman.startingY;
    pacman.currentDirection = 37;
    pacmanDied = false;
    freeze = 0;
}

function resetGhosts() {
    for (var i = 0; i < _ghostsAmount; i++)
    {
        ghosts[i].x = ghosts[i].startingX;
        ghosts[i].y = ghosts[i].startingY;
        ghosts[i].direction = 37;
    }
}
function startPlaying() {
    $("#div_endgame").hide();
    if (startGame == true) {
        init();
    }
    if (pacmanDied == true)
    {
        resetPacman();
        resetGhosts();
    }
    draw();
    _myCanvas.font = "30px Arial";
    _myCanvas.fillStyle = "white"
    _myCanvas.fillText("Get Ready", 100, 100);
    setTimeout(function () {
        intervalId = setInterval(Game, intervalSize);
    }, 1500);
}

function endGame() {
    clearInterval(intervalId);
    stopSound();
    endGameOpen();
    $("#div_endGameScore span").text(_points);

    if (0 == lives)             $("#p_endGameStatus").text("You Lost!");
    else if (_points >= 150)    $("#p_endGameStatus").text("We Have a Winner!!!");
    else                        $("#p_endGameStatus").text("You Can do better");

    startGame = true;
}

function playAgain() {
    $("#div_endgame").hide();
    $("#div_game").hide();
    $("#setting").show();
    startGame = true;
    _bonuses = [];
    _coins = [];
}

function printPicture(figure) {
    var imageObj = new Image();
    imageObj.width = "20px";
    imageObj.height = "20px";
    imageObj.src = figure.imagePath;
    _myCanvas.drawImage(imageObj, figure.x, figure.y, _cellSize, _cellSize);
}

function playSound(path) {
    gameMusic = new Audio(path);
    gameMusic.play().loop;
}

function stopSound() {
    if(null != gameMusic){
        gameMusic.pause();
        gameMusic.currentTime = 0;
    }
}

function getBestMoveForGhost(ghost) {
    var locations = getPossibleMoves(ghost);
    var lastMax = board.length * board[0].length;
    var result;
    if (locations.length == 1) return locations[0];
    for (var i = 0; i < locations.length; i++) {
        if (locations[i] != null) {

            var location;
            switch (locations[i]){
                case 37:{ //left
                    location = {x: ghost.x - 1, y: ghost.y};
                    break;
                }
                case 38:{ //up
                    location = {x: ghost.x, y: ghost.y - 1};
                    break;
                }
                case 39:{ //right
                    location = {x: ghost.x + 1, y: ghost.y};
                    break;
                }
                case 40:{ //down
                    location = {x: ghost.x, y: ghost.y + 1};
                    break;
                }
            }
            var manhattan = Math.sqrt(Math.pow(location.x - pacman.x, 2) + Math.pow(location.y - pacman.y, 2));
            if (manhattan < lastMax && (location.x != ghost.prevX || location.y != ghost.prevY)) {
                lastMax = manhattan;
                result = locations[i];
            }
            else if (manhattan == lastMax) return getNewDirection(ghost);
        }
    }
    return result;
}

function arrayCopy(array)
{
    var ans = new Array(array.length);
    for (var i = 0; i < array.length; i++)
    {
        ans[i] = new Array(array[i].length);
    }

    for (var i = 0; i < array.length; i++)
    {
        for (var j = 0; j < array.length; j++)
        {
            ans[i][j] = array[i][j];
        }
    }
    return ans;
}