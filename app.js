//Pedimos la libreria de los sockets
var child = require('child_process');
/*
 * Variables de entorno
 */
var apiUserName = 'battlepro';
var apiPassword = 'battle2011$';
var apiUrl = 'http://166.78.159.189';//'http://service.battlepro.test';//
var apiKey = '123789456';
//Child for in progress
var args = [apiUserName,apiPassword,apiUrl,apiKey];
//Verificamos la lista de torneos en progreso
//child.fork(__dirname + '/tournamentInProgress.js',args);
child.fork(__dirname + '/tournaments.js',args);
//////////////////////////////////////////////////////////////////////////////////////////////
//Check if this user is connected in other platform
child.fork(__dirname + '/disconnectedUsers.js',args);
///////////////////////////////////////////////////////////////////////////////////////////////
//Kick users last 10 seconds
child.fork(__dirname + '/usersKick.js',args);
