 const ws = new WebSocket('ws://localhost:8080');

 const yellow = 'yellow';
 const red = 'red';
 const blue = 'rgb(0, 0, 255)';
 const cyan = 'cyan';
 const green = 'green';
 const orange = 'orange';
 const gray = "rgb(128, 128, 128)";

 let game = null;
 let ID = null;
 let isReady = false;
 let isYourTurn = false;
 let hitList = [];

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
    case 'turn':
        onTurnChange(message);
        break;
    case 'lose':
        onLose(message);
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

    document.getElementById('status').innerText = message.content.toString();
    document.getElementById('state').innerText = message.state.toUpperCase();

    if(game == null)
    {
        document.getElementById('turn').innerText = 'Aguarde para posicionar suas tropas!';  
    }
    else
    {
        document.getElementById('turn').innerText = 'Posicione suas tropas!'; 
    }
}

function cellClicked(cellId) {

    if(game == null) return;

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

    if(game.state === 'gameplay' && cellId.length == 3 && isYourTurn)
    {
        const cell = cellId.slice(1);

        const EnemyBoard = game.boards[getOpponentPlayer(ID, game)];

        const hit = EnemyBoard.includes(cell);

        if(hit)
        {
            document.getElementById(cellId).style.backgroundColor = gray;
            hitList.push(cell);

            if(areListsEqual(EnemyBoard, hitList))
            {
                isYourTurn = false;
                console.log('Você venceu!');
                document.getElementById('winner').innerText = 'Você venceu!';

                const winnerMessage = {
                    type: 'winner',
                    opponentId: getOpponentPlayer(ID, game),
                    game: game,
                };

                ws.send(JSON.stringify(winnerMessage));
            }
        }
        else
        {
            document.getElementById(cellId).style.backgroundColor = blue;

            isYourTurn = false;

            const changeTurnMessage = {
                type: 'turn',
                opponentId: getOpponentPlayer(ID, game),
                game: game,
            };

            ws.send(JSON.stringify(changeTurnMessage));

            document.getElementById('turn').innerText = 'Turno do outro!';
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
        document.getElementById(headCell).style.backgroundColor = cyan;
        document.getElementById(leftCell).style.backgroundColor = cyan;
        document.getElementById(rightCell).style.backgroundColor = cyan;

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
    if(game == null) return;

    if(haveTroops() == true && isReady == false)
    {
        document.getElementById('ready').innerText = 'Você ainda possui tropas a se posicionar!';
        document.getElementById('ready').style.color = "red";
    }

    if(haveTroops() == false && isReady == false)
    {
        isReady = true;

        const readyMessage = {
            playerId: ID,
            type: 'ready',
            gameId: game.id,
            board: game.boards[ID],
            content: 'Estou pronto para a partida servidor',
        };

        ws.send(JSON.stringify(readyMessage));

        document.getElementById('turn').innerText = 'Tropas posicionadas!'; 
        document.getElementById('ready').innerText = 'Suas tropas estão prontas para partida!';
        document.getElementById('ready').style.color = "green";
    }
}

function onGamePlay(message)
{
    game = message.game;

    console.log('Mensagem do servidor:', message.content.toString());

    document.getElementById('status').innerText = message.content.toString();
    document.getElementById('state').innerText = message.game.state.toUpperCase();

    console.log(`Seu Id: ${ID} - TurnID: ${message.game.currentTurnPlayerId.content}`);

    isYourTurn = message.game.currentTurnPlayerId.content === ID;

    document.getElementById('turn').innerText = (isYourTurn) ? 'Seu Turno!' : 'Turno do outro!';
}

function onTurnChange(message)
{
    isYourTurn = true;
    document.getElementById('turn').innerText = 'Seu Turno!';
}

function onLose(message)
{
    isYourTurn = false;
    document.getElementById('winner').innerText = 'Você Perdeu!';
}

function getOpponentPlayer(playerId, game)
{
    if (game.player1Id.content === playerId) 
    {
        return game.player2Id.content;
    } 
    else if (game.player2Id.content === playerId) 
    {
        return game.player1Id.content;
    } 
    else 
    {
        return null;
    }
}

function areListsEqual(list1, list2) 
{
    if (list1.length !== list2.length) {
        return false; 
    }
    
    return list1.every(element => list2.includes(element));
}