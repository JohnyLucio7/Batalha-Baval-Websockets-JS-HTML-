 const ws = new WebSocket('ws://localhost:8080');

 let game = null;
 let ID = null;

 ws.onopen = function(event) {
    console.log('Conexão estabelecida');
    ws.send('Olá, servidor!');
};

ws.onmessage = function(event) {

    const message = JSON.parse(event.data);

    switch(message.type)
    {
    case 'waiting':
        formatGameStartedMessage(message);
        break;
    case 'id':
        console.log(message.content);
        ID = message.content;
        break;
    case 'initial':
        game = message.game;
        console.log(game.troops[ID]);
        formatGameStartedMessage(message);
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
    console.log(message);
    console.log('Mensagem do servidor:', message.content.toString());

    document.getElementById('status').innerText = message.content.toString();
    document.getElementById('state').innerText = message.state.toUpperCase();
}

function cellClicked(cellId) {
    if(game == null) return;

    if(game.state === 'setup')
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
        }
        else if(troops.submarines)
        {
            // submarinos
        }
        else if(troops.cruisers > 0)
        {
            // cruzadores
        }

        //console.log('Célula clicada:', cellId);
        //document.getElementById(cellId).style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    }
}

function spawnAircraftCarrier(cellId)
{
    const numericPart = cellId.replace(/\D/g, "");
    const alphabeticPart = cellId.replace(/\d/g, "");

    // pode escolher do 1 ao 6

    if(numericPart < 7)
    {
        for(let i = 0; i < 5; i++)
        {
            const number = parseInt(numericPart) + parseInt(i);
            const cell = `${alphabeticPart + number}`;
            console.log('cell name: '+ cell);
            document.getElementById(cell).style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        }

      game.troops[ID].aircraftCarrier--;
      console.log(game);
    }
}

function spawnBattleships(cellId)
{
    const numericPart = cellId.replace(/\D/g, "");
    const alphabeticPart = cellId.replace(/\d/g, "");

    // pode escolher do 1 ao 6

    if(numericPart < 8)
    {
        console.log("tentando por porta-aviões: " + alphabeticPart + numericPart);

        for(let i = 0; i < 4; i++)
        {
            const number = parseInt(numericPart) + parseInt(i);
            const cell = `${alphabeticPart + number}`;
            console.log('cell name: '+ cell);
            document.getElementById(cell).style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        }

      game.troops[ID].battleships--;

      console.log(game);
    }
}