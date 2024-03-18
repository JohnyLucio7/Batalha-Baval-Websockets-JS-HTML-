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

		sendMessageToAll(waitingMessage);
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

		const game = {
			player1,
			player2,
			troops: {
				[player1ID.content]: {...squadron},
				[player2ID.content]: {...squadron}
			},
			currentPlayer: player1,
			state: GameState.SETUP,
			boards:{
				player1:[],
				player2:[]
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
		content: 'Setup Game started!',
		game: game,
		state: GameState.SETUP,
	};

	sendMessageToAll(startGameMessage);
}

function handleMessage(ws, message) {
	console.log('Mensagem recebida: ', message.toString());	
}

function handleDisconnect(ws) {
   console.log('Um cliente se desconectou!');
}

function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9);
}