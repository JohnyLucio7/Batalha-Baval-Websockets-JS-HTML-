 const ws = new WebSocket('ws://localhost:8080');

 const yellow = 'yellow';
 const red = 'red';
 const blue = 'cyan';
 const green = 'green';
 const orange = 'orange';

 let game = null;
 let ID = null;
 let isReady = false;
 let isYourTurn = false;

 ws.onopen = function(event) {
    console.log('Conexão estabelecida');

    const initialMessage = {
        type: 'single',
        content: 'Olá, servidor!'
    };

    ws.send(JSON.stringify(initialMessage));
};

ws.onmessage = function(event) {

    const message = JSON.parse(event.data);

    switch(message.type)
    {
    case 'waiting':
        formatGameStartedMessage(message);
        break;
    case 'id':
        ID = message.content;
        break;
    case 'initial':
        game = message.game;
        formatGameStartedMessage(message);
        break;
    case 'gameplay':
        onGamePlay(message);
        break;
    default:
        break;
    }
};

ws.onerror = function(event) {
    console.error('Erro de WebSocket detectado:', event);
};

function formatGameStartedMessage(message)
{
    console.log('Mensagem do servidor:', message.content.toString());

    document.getElementById('turn').innerText = 'Build Turn';
    document.getElementById('status').innerText = message.content.toString();
    document.getElementById('state').innerText = message.state.toUpperCase();
}

function cellClicked(cellId) {

    if(game == null) return;

    console.log(cellId.length);

    if(game.state === 'setup' && cellId.length == 2)
    {
        let troops = game.troops[ID];

        if(troops.aircraftCarrier > 0)
        {
            // porta-aviões
            spawnAircraftCarrier(cellId);
        }
        else if(troops.battleships > 0)
        {
            // Encouraçados
            spawnBattleships(cellId);
        }
        else if(troops.seaplanes > 0)
        {
            // hidroaviões
            spawnSeaplanes(cellId);
        }
        else if(troops.submarines)
        {
            // submarinos
            spawnSubmarines(cellId);
        }
        else if(troops.cruisers > 0)
        {
            // cruzadores
            spawnCruisers(cellId);
        }
    }
}

function spawnAircraftCarrier(cellId)
{
    const numericPart = cellId.replace(/\D/g, "");
    const alphabeticPart = cellId.replace(/\d/g, "");

    if(numericPart < 7)
    {
        for(let i = 0; i < 5; i++)
        {
            const number = parseInt(numericPart) + parseInt(i);
            const cell = `${alphabeticPart + number}`;
            document.getElementById(cell).style.backgroundColor = yellow;

            game.boards[ID].push(cell);
        }

      game.troops[ID].aircraftCarrier--;
    }
}

function spawnBattleships(cellId)
{
    const numericPart = cellId.replace(/\D/g, "");
    const alphabeticPart = cellId.replace(/\d/g, "");

    let cellArray = [];
    let canSpawn = true;

    if(numericPart < 8)
    {
        for(let i = 0; i < 4; i++)
        {
            const number = parseInt(numericPart) + parseInt(i);
            const cell = `${alphabeticPart + number}`;

            if(game.boards[ID].includes(cell))
            {
                cellArray = []
                canSpawn = false;
                break;
            }

            cellArray.push(cell);
            canSpawn = true;
        }

        if(canSpawn)
        {
            cellArray.forEach(cell => {
                game.boards[ID].push(cell);
                document.getElementById(cell).style.backgroundColor = red;
            });

            game.troops[ID].battleships--;
        }
    }
}

function spawnSeaplanes(cellId)
{
    const numericPart = cellId.replace(/\D/g, "");
    const alphabeticPart = cellId.replace(/\d/g, "");

    const nextLetter = String.fromCharCode(alphabeticPart.charCodeAt(0) + 1);

    const headCell = alphabeticPart + numericPart;
    const leftCell = nextLetter + (parseInt(numericPart) - 1);
    const rightCell = nextLetter + (parseInt(numericPart) + 1);

    const includesCell = game.boards[ID].includes(headCell) || game.boards[ID].includes(leftCell) || game.boards[ID].includes(rightCell); 

    const canSpawn = (parseInt(numericPart) > 1) && (parseInt(numericPart) < 10) && (alphabeticPart !== 'J') && !includesCell;

    if(canSpawn)
    {
        document.getElementById(headCell).style.backgroundColor = blue;
        document.getElementById(leftCell).style.backgroundColor = blue;
        document.getElementById(rightCell).style.backgroundColor = blue;

        game.boards[ID].push(headCell);
        game.boards[ID].push(leftCell);
        game.boards[ID].push(rightCell);

        game.troops[ID].seaplanes--;
    }
}

function spawnSubmarines(cellId)
{
    const numericPart = cellId.replace(/\D/g, "");
    const alphabeticPart = cellId.replace(/\d/g, "");

    if(game.boards[ID].includes(cellId) == false)
    {
        document.getElementById(cellId).style.backgroundColor = green;
        game.boards[ID].push(cellId);
        game.troops[ID].submarines--;
    }
}

function spawnCruisers(cellId)
{
    const numericPart = cellId.replace(/\D/g, "");
    const alphabeticPart = cellId.replace(/\d/g, "");

    const fristCell = alphabeticPart + numericPart;
    const secondCell = alphabeticPart + (parseInt(numericPart) + 1);

    const canSpawn = game.boards[ID].includes(fristCell) == false && game.boards[ID].includes(secondCell) == false;

    if(numericPart < 10 && canSpawn)
    {
        document.getElementById(fristCell).style.backgroundColor = orange;
        document.getElementById(secondCell).style.backgroundColor = orange;

        game.boards[ID].push(fristCell);
        game.boards[ID].push(secondCell);

        game.troops[ID].cruisers--;
    }
}

function haveTroops()
{
    let troops = game.troops[ID];

    return troops.aircraftCarrier + troops.battleships + troops.seaplanes + troops.submarines + troops.cruisers;
}

function onReady()
{
    if(haveTroops())
    {
        console.log("Você ainda possui tropas a se posicionar");
    }

    if(haveTroops() == false && isReady == false)
    {
        isReady = true;

        console.log("Todas as suas tropas foram posicionadas");

        console.log("Vou avisar o servidor");

        console. log(game.boards[ID]);

        const readyMessage = {
            playerId: ID,
            type: 'ready',
            gameId: game.id,
            board: game.boards[ID],
            content: 'Estou pronto para a partida servidor',
        };

        ws.send(JSON.stringify(readyMessage));
    }
}

function onGamePlay(message)
{
    console.log('Mensagem do servidor:', message.content.toString());

    document.getElementById('status').innerText = message.content.toString();
    document.getElementById('state').innerText = message.game.state.toUpperCase();

    console.log(`Seu Id: ${ID} - TurnID: ${message.game.currentTurnPlayerId.content}`);

    isYourTurn = message.game.currentTurnPlayerId.content === ID;

    document.getElementById('turn').innerText = (isYourTurn) ? 'Seu Turno!' : 'Turno do outro!';
}