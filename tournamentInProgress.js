var request = require('request');
//Pedimos la libreria de los sockets
var io = require('socket.io').listen(8001);
io.set('log level', 1, 'log color', true);
//InTheServers
var inTheServers = {};
/*
 * Variables de entorno
 */
var apiUserName = process.argv[2];
var apiPassword = process.argv[3];
var apiUrl = process.argv[4];
var apiKey = process.argv[5];
//Cuando se realice la conexion mando esta funcion
io.sockets.on('connection', AmIInTheServer);
/*
 * De acuerdo a todos los torneos vemos cuales estan activos y cuales no
 */
function havePlayersInServers(){
    var self = this;
    this.getTournamentsInProcess = function(){
        request(apiUrl+'/Tournaments/getServerPlayers/game/csgo/format/json/api-key/'+apiKey, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                body = JSON.parse(body);
                inTheServers = body;
            }
        }).auth(apiUserName, apiPassword, false);
    }
}
//Instanciamos el objeto que nos dice los players en los torneos en progreso
var havePlayers = new havePlayersInServers;
/*
 * Le pedimos al server cada 15 segundos el estado de los torneos en progreso
 */
setInterval(function(){
    havePlayers.getTournamentsInProcess();
},15000);
/*
 * Enviamos a lo susuarios lo que esta en inTheServers
 */
function AmIInTheServer(socket){
    setInterval(function(){
        if(inTheServers){
            io.sockets.socket(socket.id).emit('AmIInTheServer', inTheServers);
        }
    },5000);
}



