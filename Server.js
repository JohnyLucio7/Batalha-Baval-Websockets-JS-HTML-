const WebSocket = require('ws');

const port = 8080;

const wss = new WebSocket.Server({port: port});

let games = []
let waitingPlayer = null

const GameState = {
	WAITING: 'waiting',
	SETUP: 'setup',
	GAMEPLAY: 'gameplay',
	GAMEOVER: 'gameover'
}

let squadron = {
	aircraftCarrier: 1,
	battleships: 2,
	seaplanes: 3,
	submarines: 4,
	cruisers: 3
}

wss.on('connection', function connection(ws){

	if(!waitingPlayer)
	{
		waitingPlayer = ws;

		const waitingMessage = {
			type: 'waiting',
			content: 'Aguardando o segundo jogador entrar...',
			state: GameState.WAITING,
		};

		waitingPlayer.send(JSON.stringify(waitingMessage));
	}
	else
	{
		const player1 = waitingPlayer;
		const player2 = ws;
		waitingPlayer = null;

		const player1ID = {
			type: 'id',
			content: generatePlayerId()
		};

		const player2ID = {
			type: 'id',
			content: generatePlayerId()
		};

		player1.send(JSON.stringify(player1ID));
		player2.send(JSON.stringify(player2ID));

		const gameID = generateGameId();

		const game = {
			id: gameID,
			player1,
			player2,
			playersReady: 0,
			player1Id: player1ID,
			player2Id: player2ID,
			currentPlayer: player1,
			state: GameState.SETUP,
			currentTurnPlayerId: player1ID,
			webSockets:
			{
				[player1ID.content]:player1,
				[player2ID.content]:player2,
			},
			troops: {
				[player1ID.content]: {...squadron},
				[player2ID.content]: {...squadron}
			},
			boards: {
				[player1ID.content]: [],
				[player2ID.content]: [],
			},
		}

		games.push(game);

		startGame(game);
	}

	ws.on('message', function incoming(message){
		handleMessage(ws, message)
	});

	ws.on('close', function close(){
		handleDisconnect(ws);
	});

});

function sendMessageToAll(message) {
	wss.clients.forEach(client => {

		if (client.readyState === WebSocket.OPEN) {

			client.send(JSON.stringify(message));
		}
	});
}

function startGame(game){

	const startGameMessage = {
		type: 'initial',
		content: 'Fase de construção iniciada!',
		game: game,
		state: GameState.SETUP,
	};

	game.player1.send(JSON.stringify(startGameMessage));
	game.player2.send(JSON.stringify(startGameMessage));
}

function handleMessage(ws, message) {

	const msg = JSON.parse(message);

	switch(msg.type)
	{
	case 'single':
		console.log('[SINGLE-MSG]: ', msg.content);
		break;
	case 'ready':
		onPlayerIsReady(msg);
		break;
	case 'turn':
		onTurnChange(msg);
		break;
	case 'winner':
		onWinner(msg);
		break;
	default:
		break;
	}
}

function handleDisconnect(ws) {
	console.log('Um cliente se desconectou!');
}

function generatePlayerId() {
	return 'player_' + Math.random().toString(36).substr(2, 9);
}

function generateGameId() {
	return 'Game_' + Math.random().toString(36).substr(2, 9);
}

function getGameById(id)
{
	const game = games.find(game => game.id === id);

	return game;
}

function updateGameList(gameUpdated)
{
	games.forEach((game, index) => {

		if(gameUpdated.id === game.id)
		{
			games[index] = gameUpdated;
			console.log(`New boards: ${JSON.stringify(games[index].boards)}`);
		}
	});
}

function onPlayerIsReady(message)
{
	console.log(`[READY-MSG]: ${message.content} - ${message.playerId} - ${message.gameId} - ${message.board}`);

	let currentGame = getGameById(message.gameId);

	currentGame.playersReady++;

	currentGame.boards[message.playerId] = message.board;

	if(currentGame.playersReady == 2)
	{
		currentGame.state = GameState.GAMEPLAY;

		const startGamePlayMessage = {
			type:'gameplay',
			content: 'Hora da batalha',
			game: currentGame,
		};

		updateGameList(currentGame);

		currentGame.player1.send(JSON.stringify(startGamePlayMessage));
		currentGame.player2.send(JSON.stringify(startGamePlayMessage));
	}
	else
	{
		updateGameList(currentGame);
	}
}

function onTurnChange(message)
{
	console.log(message);
	const game = getGameById(message.game.id);
	const playerId = message.opponentId;

	const turnMessage = {
		type: 'turn',
		content: 'is Your turn!',
	};

	game.webSockets[playerId].send(JSON.stringify(turnMessage));
}

function onWinner(message)
{
	console.log('alguém venceu!');
	
	const game = getGameById(message.game.id);
	const playerId = message.opponentId;

	const loseMessage = {
		type: 'lose',
		content: 'You Lose!',
	};

	game.webSockets[playerId].send(JSON.stringify(loseMessage));
}