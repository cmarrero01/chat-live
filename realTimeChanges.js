var io = require('socket.io').listen(8010);
io.set('log level', 1, 'log color', true);
//Cuando se realice la conexion mando esta funcion
io.sockets.on('connection', realTimeConnection);
var users = [];
function realTimeConnection(socket){
    var actions = new RealTimeActions();
    actions.manageUsers(socket);
    actions.isOnline(socket);
}

//Actions.
function RealTimeActions(){
    var self = this;

    //Managemos a lo usuarios que se loeguean en la plataforma
    this.manageUsers = function(socket){
        socket.on('userLogOn',function(user){
            self.newUser(socket,user);
        });

        socket.on('disconnect', function() {
            self.removeUser(socket);
        });
    };

    //Preguntamos si un usuario esta online o no, y enviamos el mensaje correspondiente
    this.isOnline = function(socket){
        socket.on('checkThisUser',function(userData){
            var checkUser = self.checkUser(socket,userData);
            if(checkUser){
                socket.emit('isONline',true,userData);
            }else{
                socket.emit('isONline',false,userData);
            }
        });
    };

    //Agregamos un usuario nuevo al array de usuarios
    this.newUser = function(socket,userInfo){
        var indice = self.checkUser(socket,userInfo);
        if(indice){
            var isOtherSocket = true;
            for(sockets in users[indice].sockets){
                if(users[indice].sockets[sockets].socketId == socket.id){
                    isOtherSocket = false;
                    break;
                }
            }
            //Si el socket no existe en la info del usuario, lo agregamos
            if(isOtherSocket){
                users[indice].sockets.push({socketId:socket.id});
            }
        }else{
            users.push({data:userInfo,sockets:[{socketId:socket.id}]});
        }
    };

    //Eliminamos un usuario del array de usuarios
    this.removeUser = function(socket){
        for(key in users){
            for(sock in users[key].sockets){
                if(users[key].sockets[sock].socketId == socket.id){
                    users[key].sockets.splice(sock, 1);
                }
            }
            if(users[key].sockets.length === 0) {
                users.splice(key,1);
            }
        }
    };

    //Chequeamos el usuario y devolvemos indice si existe, false si no
    this.checkUser = function(socket,userInfo){
        var indice = false;
        for(key in users){
            if(userInfo != undefined){
                if(users[key].data.environment == userInfo.userId){
                    indice = key;
                }
            }
        }
        return indice;
    };
}
