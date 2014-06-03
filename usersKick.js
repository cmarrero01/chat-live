var request = require('request');
//Pedimos la libreria de los sockets
var io = require('socket.io').listen(8004);
//Fix debug console
io.set('log level', 1, 'log color', true);
/*
 * Variables de entorno
 */
var apiUserName = process.argv[2];
var apiPassword = process.argv[3];
var apiUrl = process.argv[4];
var apiKey = process.argv[5];
/////////////////////////////////////////////////////////////////////////
io.sockets.on('connection', kickUsers);
var users = [];
function kickUsers(socket){

    socket.on('disconnect', function() {
        for(user in users){
            if(users[user].socketId == socket.id){
                users[user].when = new Date().getTime();
            }
        }
    });


    socket.on('userLogin', function(userObj) {
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
                console.log('Nuevo Usuario');
                users.push(userObj);
            }
        }else{
            console.log('Nuevo Usuario');
            users.push(userObj);
        }
    });
}

setInterval(function(){
    var now = new Date().getTime();
    for(user in users){
        var difference = now - users[user].when;
        if(difference >= 10000){
            request(apiUrl+'/user/disconnect/format/json/userId/'+users[user].environment+'/api-key/'+apiKey, function(error, response, body) {
            }).auth(apiUserName, apiPassword, false);
            delete users[user];
            users.splice(user, 1);
        }
    }
},5000);