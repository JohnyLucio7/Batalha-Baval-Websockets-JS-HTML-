const WebSocket = require('ws');

const port = 8080;

const wss = new WebSocket.Server({port: port});

let games = []
let waitingPlayer = null

wss.on('connection', function connection(ws){

	if(!waitingPlayer)
	{
		waitingPlayer = ws;

		const waitingMessage = {
			type: 'waiting',
			content: 'Aguardando o segundo jogador entrar...'
		};

		sendMessageToAll(waitingMessage);
	}
	else
	{
		const player1 = waitingPlayer;
		const player2 = ws;
		waitingPlayer = null;

		const game = {
			player1,
			player2,
			currentPlayer: player1,
			boards:{
				player1:[],
				player2:[]
			},
		}

		const gameMessage = {
			type: 'game',
			content: game
		};

		games.push(game);

		startGame(game);

		sendMessageToAll(gameMessage);
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
		content: 'Game started!'
	};

	sendMessageToAll(startGameMessage);
}

function handleMessage(ws, message) {
	console.log('Mensagem recebida: ', message.toString());	
}

function handleDisconnect(ws) {
   console.log('Um cliente se desconectou!');
}