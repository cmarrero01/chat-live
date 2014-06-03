var request = require('request');
//Pedimos la libreria de los sockets
var io = require('socket.io').listen(8002);
//Fix debug console
io.set('log level', 1, 'log color', true);
/*
 * Variables de entorno
 */
var apiUserName = process.argv[2];
var apiPassword = process.argv[3];
var apiUrl = process.argv[4];
var apiKey = process.argv[5];
/*
 * Lista de torneos con status 1 o 2
 */
var tournaments = [];
/*
 * Variable global que define el envio o no de cambios al usurio
 */
var sendChangesTouser = false;
//Cuando se realice la conexion mando esta funcion
io.sockets.on('connection', updateTournaments);

//Actualizamos la lista de torneos y lo splayers dentro
function updateTournaments(socket){
    var self = this;
    //Envia al cliente la actualizacion de los torneos y ademas deja el set inerval para hacerlo to do el tiempo
    setInterval(function(){
        if(sendChangesTouser){
            self.socketTournaments(socket);
        }
    },2000);

    this.socketTournaments = function(socket){
        console.log('Envio Al usuario la lista de torneos actualiza');
        io.sockets.socket(socket.id).emit('updateTournaments', tournaments);
    };
}
/*
 * Chequeamos las diferencias de torneos y actualizamos las listas en el desktop
 */
function GetTournaments(){
    var self = this;
    //Consultamos todos los torneos existentes y actualizamos
    this.getTournamentsFromService = function(){
        request(apiUrl+'/Tournaments/getTournaments/format/json/players/1/api-key/'+apiKey, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                payload = JSON.parse(body);
		  console.log('Pedimos la lista de torneos');
                sendChangesTouser = self.tournamentsArray(payload);
            }
        }).auth(apiUserName, apiPassword, false);
    };
    /*
     Agrego los torneos a un array o los actualizo si ya los tengo
     */
    this.tournamentsArray = function(torneo){
        var sendChange = false;
        //recorremos todos los torneos
        for(var t in torneo){
            //Definimos que no existe de entrada
            var existe = false;
            //Revisamos los torneos que estan en el array
            for(var a in tournaments){
                //Si existe el torneo en el array entramos
                if(tournaments[a].data.tournamentId === torneo[t].tournamentId){
                    //Definimos que si existe
                    existe = true;
                    //Verificamos las diferencias y si existe una, devolvemos true
                    if(self.checkDifferences(torneo[t],tournaments[a].data)){
                        console.log('Realizamos un cambio');
                        sendChange = true;
                    }
                    //Le decimos al torneo si sufrio un cambio o no
                    tournaments[a].change = sendChange;
                    //Actualizamos la informacion.
                    tournaments[a].data = torneo[t];
                }
            }
            //Si no existe en el array
            if(!existe){
                sendChange = true;
                //Lo agregamos al array
                tournaments.push({data:torneo[t],change:false});
            }
        }
        return sendChange;
    };
    //Verificamos las diferencias entre lo guardado y lo que recibimos
    this.checkDifferences = function(torneo,torneoArray){
        var result = false;
        //Verificamos la diferencia de estado
        if(torneo.status != torneoArray.status){
            result = true;
        }

        //Revisamos la diferencia del total de players
        if(torneo.totalPlayers != torneoArray.totalPlayers){
            result = true;
        }else{
            if(torneo.players != '' && torneoArray.players != ''){
                for(var key in torneo.players){
                    var diferentUser = true;
                    for(var aKey in torneoArray.players){
                        //Comparamos las diferencias entre mismos usuarios
                        if(torneoArray.players[aKey].userId == torneo.players[key].userId){
                            diferentUser = false;
                            //Revisamos si hay un cambio en el ready to play del usuario
                            if(torneoArray.players[aKey].readyToPlay != torneo.players[key].readyToPlay){
                                result = true;
                                break;
                            }
                            //Revisamos si hay cambios de usuarios baneados
                            if(torneoArray.players[aKey].active != torneo.players[key].active){
                                result = true;
                                break;
                            }
                        }
                    }
                    //Si el usuario de torneo no esta en el array, devuelvo true;
                    if(diferentUser){
                        result = true;
                        break;
                    }
                }
            }else{
                if(!result)
                    result = false;
            }
        }
        return result;
    };
}
//Instanciaos.
var tournamentsObj = new GetTournaments;
//Set interval for check disconnect users
setInterval(function() {
    tournamentsObj.getTournamentsFromService();
},3000);
