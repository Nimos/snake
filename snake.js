var Game = function (canvas, width, height, initialLength, wrapAround, moveRate) {
	// Default Game settings
	this.width = 16;
	this.height = 12;
	this.moveRate = 10;
	this.initialLength = 3;
	this.wrapAround = true;

	// We need to get a canvas argument
	if (!canvas) {
		console.log("FATAL: No canvas passed. Are you trying to play blindly?");
		return false;
	}
	this.canvas = canvas;
	this.ctx = canvas.getContext("2d");

	// Get settings from arguments
	if (width != undefined) this.width = width;
	if (height != undefined) this.height = height;
	if (initialLength != undefined) this.initialLength = initialLength;
	if (wrapAround != undefined) this.wrapAround = wrapAround;
	if (moveRate != undefined) this.moveRate = moveRate;

	// Set some constants
	// Directions
	this.RIGHT = 1;
	this.DOWN = 2;
	this.LEFT = 3;
	this.UP = 4;

	// Objects
	this.HEAD = 5;
	this.FOOD = 10;
	this.EMPTY = 0;

	// Game State
	this.RUNNING = 1;
	this.GAMEOVER = 0;

	// Register Event
	document.onkeydown = this.handleKeypress.bind(this)

	// Initialize Game
	this.newGame()

	// Start Main Loop
	this.main();
}

Game.prototype.newGame = function () {
	// Initialize game variables
	this.tiles = new Array(this.width*this.height);
	this.moveFrames = 0;
	this.score = 0;
	this.requestedMove = [];
	this.state = 1;
	this.startGrowth = this.initialLength
	this.sleepFrames = 0;

	// Create Snake
	startX = 10;
	startY = 5;
	this.posHead = [startX,startY];
	this.posTail = [startX,startY];
	this.tiles[this.coordToIndex(startX, startY)] = this.LEFT;
	this.moveDir = this.LEFT;

	// Place first food
	this.newFood()
}

Game.prototype.coordToIndex = function (x,y) {
	return y*this.width + x
}

Game.prototype.main = function () {
	// Only move every X frames, if the game is not game over, and no sleep frames are requested
	if ( this.sleepFrames-- < 0 && this.moveFrames++>=this.moveRate && this.state != this.GAMEOVER) {
		this.moveFrames = 0;

		// Check if user issued any move commands
		if (this.requestedMove[0] != undefined) {
			this.moveDir = this.requestedMove.shift();
		}

		// Store which direction we moved off the tile so our tail can follow
		this.tiles[this.coordToIndex(this.posHead[0], this.posHead[1])] = this.moveDir

		// Move head forward and claim a new tile
		// If wrap around is enabled, wrap around the edges
		// If not, game over
		if (this.moveDir == this.LEFT) {
			if (this.wrapAround) {
				this.posHead[0] = (this.posHead[0]-1) >= 0 ? (this.posHead[0]-1) : this.width-1;
			} else if (this.posHead[0]-- < 0) {
				this.gameOver(false)
			}
		} else if (this.moveDir == this.RIGHT) {
			if (this.wrapAround) {
				this.posHead[0] = (this.posHead[0]+1) % this.width;
			} else if (this.posHead[0]++ >= this.width) {
				this.gameOver(false)
			}
		} else if (this.moveDir == this.UP) {
			if (this.wrapAround) {
				this.posHead[1] = (this.posHead[1]-1) >= 0 ? (this.posHead[1]-1) : this.height-1;
			} else if (this.posHead[1]-- < 0) {
				this.gameOver(false)
			}
		} else if (this.moveDir == this.DOWN) {
			if (this.wrapAround) {
				this.posHead[1] = (this.posHead[1]+1) % this.height;
			} else if (this.posHead[1]++ >= this.height) {
				this.gameOver(false)
			}
		}

		// Assume we're not growing this turn
		grow = false;

		
		if (this.tiles[this.coordToIndex(this.posHead[0], this.posHead[1])] == this.FOOD) {
			// Reached a food powerup
			grow = true
			this.score ++;

			// Place new food object
			this.newFood()

		} else if (this.tiles[this.coordToIndex(this.posHead[0], this.posHead[1])] > 0) {
			// Collision
			this.gameOver(false)
		}

		// Put something on the new tile for rendering
		this.tiles[this.coordToIndex(this.posHead[0], this.posHead[1])] = this.HEAD

		// Grow until we reach the initial length
		if (this.startGrowth-- > 0) {
			grow = true
		}

		// If we're not growing, move tail
		if (!grow) {
			index = this.coordToIndex(this.posTail[0], this.posTail[1]);
			
			// Move in the current direction 
			// wrap around if needed
			if (this.tiles[index] == this.LEFT) {
				this.posTail[0] = this.posTail[0]-1 >= 0 ? this.posTail[0]-1 : this.width-1;
			} else if (this.tiles[index] == this.RIGHT) {
				this.posTail[0] = (this.posTail[0]+1) % this.width;
			} else if (this.tiles[index] == this.UP) {
				this.posTail[1] = this.posTail[1]-1 >= 0 ? this.posTail[1]-1 : this.height-1;
			} else if (this.tiles[index] == this.DOWN) {
				this.posTail[1] = (this.posTail[1]+1) % this.height;
			}

			// Clear Tail Tile
			this.tiles[index] = this.EMPTY;
		}

	}

	this.render();
	requestAnimationFrame(this.main.bind(this));

}

Game.prototype.newFood = function () {
	// Find all tiles that are not yet occupied by the snake
	var emptyTiles = []
	for (var x=0; x<this.tiles.length; x++) {
		if (this.tiles[x] == undefined || this.tiles[x] == this.EMPTY)
			emptyTiles.push(x);
	}
	// End the game if there are no more empty spots
	if (emptyTiles.length == 0)
		this.gameOver()

	// Randomly pick one of the empty tiles
	index = Math.floor(Math.random()*(emptyTiles.length))

	// Place Food
	this.tiles[emptyTiles[index]] = this.FOOD
}

Game.prototype.render = function () {
	var pX = this.canvas.width;
	var pY = this.canvas.height;


	var tileWidth = pX/this.width;
	var tileHeight = pY/this.height;

	this.ctx.fillStyle = "#000000";
	this.ctx.fillRect(0,0,pX,pY);
	this.ctx.fillStyle = "#111";

	// Draw a grid
	for (var y=0; y<this.height; y++) {
		this.ctx.fillRect(0,y*tileHeight,pX,1);
	}
	for (var x=0; x<this.width; x++) {
		this.ctx.fillRect(x*tileWidth,0,1,pY);
	}

	// Draw filled tiles
	for (var y=0;y<this.height;y++) {
		for (var x=0;x<this.width;x++) {
			if (this.tiles[this.coordToIndex(x,y)] == this.FOOD) {
				// Draw food powerups in green
				this.ctx.fillStyle = "#0C0"
				this.ctx.fillRect(x*tileWidth, y*tileHeight, tileWidth, tileHeight);
			} else if (this.tiles[this.coordToIndex(x,y)] > 0) {
				// Draw different snake parts depending on the direction
				this.ctx.fillStyle = "#DDD"
				if (this.tiles[this.coordToIndex(x,y)] == this.LEFT) {
					this.ctx.fillRect(x*tileWidth-tileWidth*0.2, y*tileHeight+tileHeight*0.1, tileWidth*1.1, tileHeight*0.8);	
				} else if (this.tiles[this.coordToIndex(x,y)] == this.UP) {
					this.ctx.fillRect(x*tileWidth+tileWidth*0.1, y*tileHeight-tileHeight*0.2, tileWidth*0.8, tileHeight*1.1);	
				} else if (this.tiles[this.coordToIndex(x,y)] == this.RIGHT) {
					this.ctx.fillRect(x*tileWidth+tileWidth*0.1, y*tileHeight+tileHeight*0.1, tileWidth*1.1, tileHeight*0.8);			
				} else if (this.tiles[this.coordToIndex(x,y)] == this.DOWN) {
					this.ctx.fillRect(x*tileWidth+tileWidth*0.1, y*tileHeight+tileHeight*0.1, tileWidth*0.8, tileHeight*1.1);	
				} else {
					this.ctx.fillRect(x*tileWidth, y*tileHeight, tileWidth, tileHeight);
				}
			}
		}
	}

	this.ctx.fillStyle = 'white';
	this.ctx.strokeStyle = 'black';
	this.ctx.font = '30px Arial';
	this.ctx.lineWidth = 3;

	if (this.state != this.GAMEOVER) {
		// Draw Score in top left corner
		this.ctx.strokeText('Score: '+this.score, 5, 30);
		this.ctx.fillText('Score: '+this.score,5,30);
	} else {
		// If GAME OVER, draw some other text, and put the score in the center
		this.ctx.font = '50px Arial';
		this.ctx.strokeText('Game Over :(', pX/2-130, pY/2-50);
		this.ctx.fillText('Game Over :(', pX/2-130, pY/2-50);		
		this.ctx.font = '30px Arial';
		this.ctx.strokeText('Score: '+this.score, pX/2-40, pY/2);
		this.ctx.fillText('Score: '+this.score, pX/2-40, pY/2);
		this.ctx.strokeText('Press any key to restart', pX/2-140, pY/2+30);
		this.ctx.fillText('Press any key to restart', pX/2-140, pY/2+30);
	}



}

Game.prototype.handleKeypress = function (e) {
	// Don't process any keys while asleep
	if (this.sleepFrames > 0) return;

	// On the game over screen, let any key restart the game
	if (this.state == this.GAMEOVER) {
		this.newGame()
	}

	// For each arrow key, queue a direction change on the next move.
	// Only queue up to 3 inputs and to keep a smooth feeling
	// Don't queue up duplicate commands or 180 turns
	// Return false if arrow key is pressed to prevent in browser key handling (scrolling the page)
	if (this.requestedMove.length<3) {
		if (this.requestedMove[this.requestedMove.length-1]) {
			compare = this.requestedMove[this.requestedMove.length-1];
		} else {
			compare = this.moveDir;
		}

		if (e.keyCode == 37) {
			if (compare != this.RIGHT && compare != this.LEFT) this.requestedMove.push(this.LEFT);
		} else if (e.keyCode == 38) {
			if (compare != this.DOWN && compare != this.UP) this.requestedMove.push(this.UP);
		} else if (e.keyCode == 39) {
			if (compare != this.LEFT && compare != this.RIGHT) this.requestedMove.push(this.RIGHT);
		} else if (e.keyCode == 40) {
			if (compare != this.UP && compare != this.DOWN) this.requestedMove.push(this.DOWN);
		} else {
			return true;
		}
	}
	return false;
}


Game.prototype.gameOver = function () {
	// Freeze the game for a second to prevent players from accidentally restarting before realizing what happened
	this.sleepFrames = 60;
	this.state = this.GAMEOVER;
}