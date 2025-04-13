var blockSize = 15;
var rows = 40;
var cols = 20;
var tileRole;
var roleSpeed = 10;
var board;
var context;
var snakeBody = [];
var fps = 15;
var frameInterval =  1000/fps;
var updateIntervalId;
var zombieAmount = 3;
var zombieRunSpeed = 10;
var spottingRange = 10;
var score = 0;
var bulletSize = blockSize / 5;

//Originally I wanted the player to constantly run backwards and the barricades remain stationary, but I later found it to be easier to just make the 
//barricades move upwards and the player stationary. It looks like the player is moving downwards anyway

let barricadePreset = [
    ['-', '-', '-', '-', ' ', ' ', '-', '-', '-', '-'],
    ['-', '-', '-', ' ', ' ', ' ', ' ', '-', '-', '-'],
    ['-', ' ', '-', '-', ' ', ' ', '-', '-', ' ', '-'],
    [' ', '-', '-', '-', ' ', ' ', '-', '-', '-', ' ']
]

let barricades = [];
let zombies = [];
let bullets = [];
let powerUps = [];
let onMapPowerUp = null;
let xhttp;
let requestId;

let mapCenter = {
    X : (cols * blockSize)/2,
    Y : (rows * blockSize)/2
}

class barricade{
    constructor({ position }) {
        console.log(position);
        this.position = position;
        this.width = blockSize * 2;
        this.height = blockSize;
    }
    draw(context) {
        context.fillStyle = 'blue';
        context.fillRect(this.position.X, this.position.Y, this.width, this.height);
    }
}

class bullet{
    constructor(X, Y){
        this.X = X;
        this.Y = Y;
        this.width = bulletSize;
        this.height = bulletSize;
        this.speed = -30;
    }

    draw(context) {
        context.fillStyle = 'white';
        context.fillRect(this.X, this.Y, this.width, this.height);
    }
}

class powerUp {
    constructor(effect, color){
        this.X = Math.floor(Math.random() * cols ) * blockSize;
        this.Y = rows * blockSize;
        this.width = blockSize;
        this.height = blockSize;
        this.effect = effect;
        this.color = color;
    }

    draw(context) {
        console.log("draw powerUp method called")
        context.fillStyle = this.color;
        context.fillRect(this.X, this.Y, this.width, this.height);
    }

    apply(){
        switch(this.effect[0]){
            case "changeWeapon":
                player.weapon = this.effect[1];
                break;
            case "enlargeBullet":
                bulletSize = this.effect[1] * bulletSize;
                if (bulletSize > blockSize * 2){
                    powerUps.splice(1,1);
                }
                break;
            case "slowDownZombie":
                zombieRunSpeed -= this.effect[1];
                console.log(`zombie slowed to speed (${zombieRunSpeed}) (random)`) //that "(random)" is for console filtering
        }
        console.log("effect applied (random)")
    }
}

let player = {
    X : blockSize * 10,
    Y : blockSize * 10,
    width : blockSize,
    height : blockSize,
    velocityX : 0,
    velocityY : 0,
    speed : 15,
    size : 15,
    weapon : "pistol"
}

let toShotGun = new powerUp(["changeWeapon","shotGun"], "cyan");
powerUps.push(toShotGun);
let enlargeBullet = new powerUp(["enlargeBullet",2], "grey");
powerUps.push(enlargeBullet);
let slowDownZombie = new powerUp(["slowDownZombie", 1], "skyblue");
powerUps.push(slowDownZombie);

document.addEventListener("DOMContentLoaded",init, false);


function move(e){
    switch(e.code) {
        case "ArrowUp":
            player.velocityY = -player.speed;
            break;
        case "ArrowDown":
            player.velocityY = player.speed;
            break;
        case "ArrowLeft":
            player.velocityX = -player.speed;
            break;
        case "ArrowRight":
            player.velocityX = player.speed;
            break;
        case "Space":
            switch(player.weapon){
                case "pistol":
                    let shotBullet = new bullet(player.X + 7, player.Y);
                    bullets.push(shotBullet);
                    console.log("bullet shot, weapon: pistol");
                    console.log(`position (${shotBullet.X}, ${shotBullet.Y})`);
                    break;
                case "shotGun":
                    let playerCenterX = player.X + 7
                    let pallet1 = new bullet(player.X + 7, player.Y);
                    let pallet2 = new bullet(playerCenterX - bulletSize - 5, player.Y);
                    let pallet3 = new bullet(playerCenterX + bulletSize + 5, player.Y);
                    bullets.push(pallet1);
                    bullets.push(pallet2);
                    bullets.push(pallet3);
            }
    }
}

function halt(e){
    switch(e.code) {
        case "ArrowUp":
            player.velocityY = 0;
            break;
        case "ArrowDown":
            player.velocityY = 0;
            break;
        case "ArrowLeft":
            player.velocityX = 0;
            break;
        case "ArrowRight":
            player.velocityX = 0;
            break;
    }
}

function checkCollide(object1, object2){
    if (object1.X + object1.width < object2.X || 
        object2.X + object2.width < object1.X ||
        object1.Y > object2.Y + object2.height ||
        object2.Y > object1.Y + object1.height){
        return false;
    } else {
        return true;
    }
}

function collideWithBarricade(object1, object2) {
    if (object1.X + object1.width <= object2.position.X || 
        object2.position.X + object2.width <= object1.X ||
        object1.Y + object1.height <= object2.position.Y ||
        object2.position.Y + object2.height <= object1.Y) {
        return false;
    } else {
        return true;
    }
}

function inCanvas (object, rows, cols) {
    if (object.X + object.velocityX < 0 ||
        object.Y + object.velocityY < 0 ||
        object.X + blockSize + object.velocityX > rows * blockSize ||
        object.Y + blockSize + object.velocityY > cols * blockSize){
            return false;
        }

    else{
        return true;
    }
}

function getRandomBarricadePreset() {
    var randomIndex = Math.floor(Math.random() * barricadePreset.length);
    return barricadePreset[randomIndex];
}

function generateBarricades() {
    barricades = [];
    let randomPreset = getRandomBarricadePreset();
    randomPreset.forEach((symbol, i) => {
        if (symbol === '-') {
            let newBarricade = new barricade({
                position: {
                    X: blockSize * 2 * i,
                    Y: board.height - blockSize
                }
            });

            barricades.push(newBarricade);
        }
    });
}

function spawnZombie(){
    let zombie = {
        X : Math.floor(Math.random() * cols ) * blockSize,
        Y : 0 - zombieRunSpeed,
        width : blockSize,
        height : blockSize,
        velocityX : 0,
        velocityY : 0,
        speed : zombieRunSpeed,
        size : 15,
        score : 10
    }

    zombies.push(zombie);
}

function zombieMove(thatZombie){
    thatZombie.velocityY = thatZombie.speed;

    let verticalDistance = Math.abs(thatZombie.Y - player.Y);
    let horizontalDistance = Math.abs(thatZombie.X - player.X);

    if (verticalDistance <= blockSize * spottingRange &&
        horizontalDistance <= blockSize * spottingRange){
        if (thatZombie.X < player.X) {
            thatZombie.velocityX =  5;
        } else if (thatZombie.X > player.X) {
            thatZombie.velocityX = -5;
        }
    }

    if (verticalDistance < blockSize){
        thatZombie.velocityY = 0;
    }

    if (horizontalDistance < blockSize){
        thatZombie.velocityX = 0;
    }

    if (thatZombie.Y >= player.Y){
        thatZombie.velocityY = 0;
        if (verticalDistance <= blockSize * spottingRange){
            thatZombie.velocityY -= thatZombie.speed;
        }
    }




    barricades.forEach(barricade => {
        if (collideWithBarricade(thatZombie, barricade)){
            let zombieTop = thatZombie.Y;
            let zombieBottom = thatZombie.Y + thatZombie.height;
            let barricadeTop = barricade.position.Y;
            let barricadeBottom = barricade.position.Y + barricade.height;
            let horizontalOverlap = (thatZombie.X + thatZombie.width > barricade.position.X) && 
                                      (thatZombie.X < barricade.position.X + barricade.width);
            if (zombieBottom >= barricadeTop || zombieBottom < barricadeBottom) {
                console.log("That zombie is directly above the barricade, push up");
                thatZombie.Y = barricadeTop - thatZombie.height;
                if (thatZombie.velocityY > 0){
                    thatZombie.velocityY = 0;
                }

                if (thatZombie.velocityX = 0){
                    if (thatZombie.X > mapCenter.X){
                        thatZombie.velocityX += thatZombie.speed;
                    }
                    else if (thatZombie.X < mapCenter.X){
                        thatZombie.velocityX -= thatZombie.speed;
                    }
                }
            }
        }
    
    });

    let newX = thatZombie.X + thatZombie.velocityX;
    let newY = thatZombie.Y + thatZombie.velocityY;

    if (newX >= 0 && newX + thatZombie.size <= cols * blockSize) {
        thatZombie.X = newX;
    }
    if (newY >= 0 && newY + player.size <= rows * blockSize) {
        thatZombie.Y = newY;
    }

    if (checkCollide(thatZombie, player)){
        console.log("died")
        message = "You died! Score:" + String(Math.round(score))
        gameOver(message);
    }

}

function checkBulletHit(){
    for (let b = 0; b < bullets.length; b++){
        thatBullet = bullets[b];
        if (thatBullet.Y < 0){
            bullets.splice(b,1);
            console.log("bullet removed")
            console.log(`bullets: (${bullets})`);
        }
        thatBullet.Y += thatBullet.speed;
        thatBullet.draw(context);
        console.log(`bullet position (${thatBullet.X}, ${thatBullet.Y})`);
        for (let z = 0; z < zombies.length; z++){
            thatZombie = zombies[z];
            if (checkCollide(thatBullet, thatZombie)){
                zombies.splice(z, 1);
                bullets.splice(b,1);
                console.log("zombie killed")
                score += thatZombie.score;
            }
        }
    }
}

function placePowerUp(){
    var randomIndex = Math.floor(Math.random() * powerUps.length);
    console.log(`random index (${randomIndex})`);
    let thatPowerUp = powerUps[randomIndex];
    console.log(`random powerUp (${thatPowerUp.effect[0]})`)
    onMapPowerUp = thatPowerUp;
    if (onMapPowerUp.Y < 0){
        onMapPowerUp.Y = rows * blockSize
    }
}

function zombieMoveTest(thatZombie){
    thatZombie.Y += thatZombie.speed;
}

function gameOver(message){
    clearInterval(updateIntervalId);
    player.velocityX = 0;
    player.velocityY = 0;
    zombies.forEach(thatZombie=>{
        thatZombie.velocityX = 0;
        thatZombie.velocityY = 0;
    });

    document.getElementById("message").textContent = message;
    document.removeEventListener("keydown", move, false);
    document.removeEventListener("keyup", halt, false);
    frameInterval = 0;

    let messageElement = document.getElementById("message");
    if (messageElement) {
        messageElement.innerHTML = message + " Score: " + score;
    }
    let data = new FormData();
    data.append("score", score);

    xhttp = new XMLHttpRequest();
    xhttp.addEventListener("readystatechange", handleResponse, false);
    xhttp.open("POST", "/postScore", true);
    xhttp.send(data);

}

function handleResponse(){
    if (xhttp.readyState === 4){
        if (xhttp.status === 200){
            if (xhttp.responseText === "success"){
                console.log("Response received: ", xhttp.responseText);
            }

            else{
                console.log("Error submitting score: ", xhttp.statusText);
            }
        }

    }
}

function init(){
    board = document.getElementById("board");
    board.height = rows * blockSize;
    board.width = cols * blockSize;
    context = board.getContext("2d");
    
    document.addEventListener("keydown", move, false)
    document.addEventListener("keyup", halt, false)
    updateIntervalId = setInterval(update, frameInterval);
}











function update(){
    context.fillStyle = "black";
    context.fillRect(0, 0, board.width, board.height);

    if (barricades.length === 0 || barricades[0].position.Y + barricades[0].height < 0) {
        generateBarricades(); 
    } else {
        barricades.forEach(barricade => {
            barricade.position.Y -= roleSpeed;
            barricade.draw(context);
        });
    }

    if (zombies.length < zombieAmount){
        spawnZombie();
        console.log(`zombie spawned, position (${zombies[0].X}, ${zombies[0].Y})`);
    }

    for (let i = 0; i < zombies.length; i++) {
        thatZombie = zombies[i];
        zombieMove(thatZombie);
        context.fillStyle = "red";
        context.fillRect(thatZombie.X, thatZombie.Y, thatZombie.size, thatZombie.size)
        if (thatZombie.Y > rows * blockSize || 
            thatZombie.Y < 0){
            zombies.splice(i, 1);
        }
    }

    barricades.forEach(barricade => {
        if (collideWithBarricade(player, barricade)) {
            let playerTop = player.Y;
            let playerBottom = player.Y + player.height;
            let barricadeTop = barricade.position.Y;
            let barricadeBottom = barricade.position.Y + barricade.height;

            let horizontalOverlap = (player.X + player.width > barricade.position.X) && 
                                      (player.X < barricade.position.X + barricade.width);

            let onTheEdge = (playerBottom + player.width == barricade.position.X) || (playerBottom == barricade + barricade.width);
    
            if (playerBottom >= barricadeTop || playerBottom < barricadeBottom) {
                console.log("Player is directly above the barricade, push up");
                player.Y = barricadeTop - player.height;
                if (player.velocityY > 0){
                    player.velocityY = 0;
                }
            }

            else if (playerTop >= barricadeBottom || playerTop >= barricadeTop) {
                console.log("Player is directly below the barricade");
                console.log(`player position (${player.X}, ${player.Y}) barricade position (${barricade.position.X}, ${barricade.position.Y})`);
                player.Y = barricadeBottom;
                if (player.velocityY < 0){
                    player.velocityY = 0;
                }
            }
        }
    });

    let newX = player.X + player.velocityX;
    let newY = player.Y + player.velocityY;

    if (newX >= 0 && newX + player.size <= cols * blockSize) {
        player.X = newX;
    }
    if (newY >= 0 && newY + player.size <= rows * blockSize) {
        player.Y = newY;
    }
    context.fillStyle = "lime";
    context.fillRect(player.X, player.Y, player.size, player.size)

    checkBulletHit();

    score += 1;
    console.log(`current score (${score})`);

    if (score % 200 == 0){
        zombieAmount += 1;
        zombieRunSpeed += 1;
    }

    if (score % 40 == 0 && onMapPowerUp == null){
        placePowerUp();
        console.log(`random powerUp placed (${onMapPowerUp.X}, ${onMapPowerUp.Y})`);
        console.log(`current score (${score})`);
    }

    if (onMapPowerUp) {
        onMapPowerUp.Y -= roleSpeed; 
        if (onMapPowerUp.Y + onMapPowerUp.height > 0) {
            onMapPowerUp.draw(context);
            if (checkCollide(player, onMapPowerUp)){
                onMapPowerUp.apply();
                onMapPowerUp.Y = rows * blockSize;
                onMapPowerUp = null;
                console.log("got powerUp (random)");
            }
        } else {
            onMapPowerUp = null;
        }
    }
}