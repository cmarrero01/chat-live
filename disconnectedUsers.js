//Pedimos la libreria de los sockets
var io = require('socket.io').listen(8003);
//Fix debug console
io.set('log level', 1, 'log color', true);
/*
 * Variables de entorno
 */
/*var apiUserName = process.argv[2];
var apiPassword = process.argv[3];
var apiUrl = process.argv[4];
var apiKey = process.argv[5];*/
io.sockets.on('connection', checkUniqueLogin);
var users = [];
var disconnectSockets = [];
function checkUniqueLogin(socket){
    socket.on('checkUser', function(userObj) {
        userObj.socketId = socket.id;
        //array users have users ?
        if(users.length > 0){
            var newUser = true;
            for(user in users){
                //Is desktop?
                if(users[user].app == 1){
                    //Is equal to the user login?
                    if(users[user].environment == userObj.environment && users[user].socketId == socket.id){
                        console.log('El usuario ya esta');
                        newUser = false;
                    }
                }
            }
            if(newUser){
                users.push(userObj);
            }
        }else{
            users.push(userObj);
        }

        console.log(users);
        var disconnect = false;

        for(user in users){
            //Is desktop?
            if(users[user].app == 1){
                //Is equal to the user login?
                if(users[user].environment == userObj.environment){
                    console.log('Es el mismo usuario');
                    newUser = false;
                    //Is other Socket?
                    if(socket.id != users[user].socketId){
                        console.log('vamos a desconectar');
                        disconnect = true;
                        disconnectSockets.push(users[user])
                        delete users[user];
                        users.splice(user, 1);
                        break;
                    }
                }
            }
        }

        if(disconnect){
            for(d in disconnectSockets){
                io.sockets.socket(disconnectSockets[d].socketId).emit('logOutUser',disconnect);
            }
            disconnectSockets = [];
        }
    });
}