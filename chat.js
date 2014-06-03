var apiUserName = 'battlepro';
var apiPassword = 'battle2011$';
var apiUrl = 'http://166.78.159.189';//'http://service.battlepro.test';//
var apiKey = '123789456';
/////////////////////////////////////////////////
var request = require('request');
//Pedimos la libreria de los sockets
var sock = require('socket.io');
//Requerimos la libreria socket y escuchamos que tiene para decir express
var io = sock.listen(8000);
//Fix debug console
io.set('log level', 1, 'log color', true);
/**
 * Usuarios conectados al servidor de chats.
 * @type Array
 */
var usernames = [];
/**
 * Datos que se comparten entre los usuarios conectados.
 * @type Array
 */
var conectados = [];
/**
 * Usuarios que se desconectan por un tiempo menor a 30 segundos estan en este array
 * @type Array
 */
var disconnect = [];

/**
 * Conversaciones existentes.
 * @type Array
 */
var chats = new Array();
/**
 * Función que maneja todo lo que ocurre entre el cliente y el servidor.
 * @param {type} param1
 * @param {type} param2
 */
io.sockets.on('connection', chatFunctions);
/*
 * Chat functions
 */
function chatFunctions(socket) {
    var self = this;
    /**
     * Agregar usuario.
     * Si un usuario que ya tiene una ventana abierta abre otra o una pestaña,
     * va a tener más de un socket.id
     * @param {type} username
     * @param {type} email
     * @param {type} userId
     * @param {type} plano
     * @param {type} app
     * @param {type} environment
     */
    socket.on('adduser', function(userObj) {
        if (usernames.length === 0) {
            //sino existe lo añade con UN solo socketId
            usernames.push({name: userObj.nicename, socketsId: [socket.id], userId: userObj.userId, environment: userObj.environment, app: userObj.app});
            conectados.push({userName: userObj.nicename, userID: userObj.userId, environment: userObj.environment, app: userObj.app});
        } else {
            for (var j = 0; j < usernames.length; j++) {
                //si ya existe, añade el nuevo socketId
                if (usernames[j].userId === userObj.userId) {
                    usernames[j].socketsId.push(socket.id);
                    break;
                } else {
                    //sino existe lo añade con UN solo socketId
                    usernames.push({name: userObj.nicename, socketsId: [socket.id], userId: userObj.userId, environment: userObj.environment, app: userObj.app});
                    conectados.push({userName: userObj.nicename, userID: userObj.userId, environment: userObj.environment, app: userObj.app});
                    break;
                }
            }
        }
        //le avisa a los clientes que alguien se ha conectado, envía el nombre y el userId
        self.controladorNuevoUsuario(userObj.userId, userObj.nicename);
    });
    //Envia un chat al usuario
    socket.on('sendchat', function(userID, friendID, data, conversacion) {
        self.forwardMsg(userID, friendID, data, conversacion);
    });
    /**
     * Crea la relación entre los users con sus sockets.
     * @param {type} userID
     * @param {type} friendID
     * @param {type} chatID
     */
    socket.on('chatInit', function(userID, friendID, chatID) {
        if (chats.indexOf(chatID) === -1) {
            chats.push(chatID);
        }
    });
    /**
     * Recibe el evento de que alguien ha cerrado una ventana.
     */
    socket.on('disconnect', function() {
        self.disconnect(socket.id);
    });
    /**
     * Busca un usuario por su userID junto con el socketID y elimina ese mismo socketID,
     * si era el último socketID de un usuario lo elimina de la lista de usernames al usuario,
     * luego informa a los demás usuarios de este evento.
     * @param {type} socketid
     * @returns {undefined}
     */
    this.disconnect = function(socketid) {
        for (var x = 0; x < usernames.length; x++) {
            for (var j = 0; j < usernames[x].socketsId.length; j++) {
                // si lo encuentra borra el socket.id que ya no existe
                if (usernames[x].socketsId[j] === socketid) {
                    usernames[x].socketsId.splice(usernames[x].socketsId[j], 1);
                    break;
                }
            }
            // si ya no quedan sockets para eliminar de este usuario elimina al usuario
            if (usernames[x].socketsId.length === 0) {
                var userext = usernames[x].userId;
                var userExtName = usernames[x].name;
                //Notificamos al server que este usuario se desconecto
                var firstDisconnection = true;
                //Si el usuario ya esta en el array de desconexiones actualizamos el momento de su desconexion.
                for(d = 0; d < disconnect.length; d++){
                    if(disconnect[d].userId === usernames[x].userId){
                        firstDisconnection = false;
                        disconnect[d].when = new Date().getTime();
                    }
                }

                //Si es la primera vez que se desconecto lo agregamos al array
                if(firstDisconnection){
                    disconnect.push({userId: usernames[x].userId, environment: usernames[x].environment, app: usernames[x].app, when:new Date().getTime()});
                }

                delete usernames[x];
                usernames.splice(x, 1);
                // luego lo elimina de la lista de conectados
                for (var c = 0; c < conectados.length; c++) {
                    if (conectados[c].userID === userext) {
                        delete conectados[c];
                        conectados.splice(c, 1);
                        self.userRemoved(userext, userExtName);
                    }
                }

            }
        }
    };
    /**
     * Avisa a los conectados que un usuario ya no está conectado.
     * @param {type} userID
     * @param {type} userExtName
     * @returns {undefined}
     */
    this.userRemoved = function(userID, userExtName) {
        for (var i = 0; i < usernames.length; i++) {
            for (var q = 0; q < usernames[i].socketsId.length; q++) {
                //avisa a cada socketID de un usuario del evento
                io.sockets.socket(usernames[i].socketsId[q]).emit('userremoved', userID, userExtName);
            }
        }
    };
    /**
     * Busca el socketID del amigo a quien se desea re enviar el mensaje.
     * Lo busca dentro de usernames.
     * @param {type} userID
     * @param {type} friendID
     * @param {type} data
     * @param {type} conversacion
     * @returns {undefined}
     */
    this.forwardMsg = function(userID, friendID, data, conversacion) {
        // busca el nombre del enviante
        var nombreEnviante = '';
        var nombreAmigo = '';
        for (var p = 0; p < usernames.length; p++) {
            if (usernames[p].userId === userID) {
                nombreEnviante = usernames[p].name;
                break;
            }
        }
        for (var p = 0; p < usernames.length; p++) {
            if (usernames[p].userId === friendID) {
                nombreAmigo = usernames[p].name;
                break;
            }
        }
        // el emisor debe recibir sus propios mensajes
        for (var r = 0; r < usernames.length; r++) {
            if (usernames[r].userId === userID) {
                for (var t = 0; t < usernames[r].socketsId.length; t++) {
                    io.sockets.socket(usernames[r].socketsId[t]).emit('updatechat', friendID, nombreAmigo, nombreEnviante, conversacion, data);
                }
            }
        }

        // busca al usuario destino del mensaje
        for (var i = 0; i < usernames.length; i++) {
            if (usernames[i].userId === friendID) {
                // envía el mensaje a todos los sockets del destino
                for (var q = 0; q < usernames[i].socketsId.length; q++) {
                    io.sockets.socket(usernames[i].socketsId[q]).emit('updatechat', userID, nombreAmigo, nombreEnviante, conversacion, data);
                }
            }
        }
    };

    /**
     * Método que controla la entrada de un nuevo usuario al chat.
     * @param {type} userId
     * @param {type} username
     * @returns {undefined}
     */
    this.controladorNuevoUsuario = function(userId, username) {
        var objetoUser = [];
        //el objetoUser tiene al usuario que acaba de entrar y debe avisar a sus contactos
        objetoUser.push({userName: username, userID: userId});
        var misAmigos = [];
        var friendsMD5 = [];
        var amigosConectados = [];

        //Opciones de conexion
        var options = {
            url:apiUrl+'/user/chat_userFriends/format/json/userId/'+userId+'/api-key/'+apiKey,
            method:'GET',
            json:true

        };
        request(options, function(error, response, body) {
            //endpoint para hacer pruebas locales --> cambiar en un push
            //funciona correctamente
            if (!error && response.statusCode === 200) {
                console.log(body);
                //recorta la respuesta ya que contiene caractares por demás
                //devuelve un json de los amigos que este usuario tiene.
                misAmigos = body.result;
                //convierte a md5 los userIds de los amigos del usuario
                for (var w = 0; w < misAmigos.length; w++) {
                    friendsMD5.push(require('crypto').createHash('md5').update(misAmigos[w].friendId).digest("hex"));
                }
                //revisa cuales esten conectados
                for (var c = 0; c < conectados.length; c++) {
                    //se espera que los conectados sean iguales o más que los amigos de un usuario
                    for (var s = 0; s < friendsMD5.length; s++) {
                        //compara a los conectados con los amigos del usuario
                        if (conectados[c].userID === friendsMD5[s]) {
                            amigosConectados.push(conectados[c]);
                        }
                    }
                }
            }
            var listaCompleta = [];
            //revisa cuáles están conectados
            for (var c = 0; c < conectados.length; c++) {
                //se espera que los conectados sean iguales o más que los amigos de un usuario
                for (var f = 0; f < friendsMD5.length; f++) {
                    //compara a los conectados con los amigos del usuario
                    if (conectados[c].userID === userId) {
                        listaCompleta.push(conectados[c]);
                    }
                }
            }
            //agrega al último en haber entrado
            for (var r = 0; r < amigosConectados.length; r++) {
                for (var i = 0; i < usernames.length; i++) {

                    //aviso a mis amigos que hagan append
                    if (amigosConectados[r].userID === usernames[i].userId) {
                        for (var q = 0; q < usernames[i].socketsId.length; q++) {
                            io.sockets.socket(usernames[i].socketsId[q]).emit('updateusers', objetoUser);
                        }
                    }

                    //actualizo (o creo) mi lista de amigos
                    if (userId === usernames[i].userId) {
                        for (var q = 0; q < usernames[i].socketsId.length; q++) {
                            io.sockets.socket(usernames[i].socketsId[q]).emit('updateusers', amigosConectados);
                        }
                    }
                }
            }
        }).auth(apiUserName, apiPassword, false);
    };
}
