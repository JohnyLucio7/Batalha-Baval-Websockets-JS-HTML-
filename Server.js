const WebSocket = require('ws');

const port = 8080;

const wss = new WebSocket.Server({port: port});

let games = []
let waitingPlayer = null

wss.on('connection', function connection(ws){

	if(!waitingPlayer)
	{
		waitingPlayer = ws;
		ws.send("Aguardando o segundo jogador entrar..."); // o cliente recebe a msg
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

		games.push(game);

		startGame(game);
	}

	ws.on('message', function incoming(message){
		handleMessage(ws, message)
	});

	ws.on('close', function close(){
		handleDisconnect(ws);
	});

	//ws.send('Bem vindo cliente');
});

function startGame(game){
	game.player1.send("Game started!");
    game.player2.send("Game started!");
}

function handleMessage(ws, message) {
	console.log('Mensagem recebida: ', message.toString());	
}

function handleDisconnect(ws) {
   console.log('Um cliente se desconectou!');
}