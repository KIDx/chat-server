
/**
 * Module dependencies.
 */

function nan(n) {
	return n != n;
}

var express = require('express')
,	routes = require('./routes')
,	http = require('http')
,	path = require('path')
,	MongoStore = require('connect-mongo')(express)
,	mongoose = require('mongoose');

var app = express()
,	server = http.createServer(app)
,	io = require('socket.io').listen(server)
,	cookie = require('express/node_modules/cookie')
,	utils = require('express/node_modules/connect/lib/utils')
,	config = require('./config')
,	sessionStore = new MongoStore({ db : config.db })
,	socketID = {};

// all environments
app.set('port', process.env.PORT || 5000);
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
//app.use(express.favicon());
app.use(express.logger('dev'));

app.use(express.compress()); //使用gzip进行压缩传输
app.use(express.bodyParser());
app.use(express.methodOverride());

app.use(express.cookieParser());

app.use(express.session({
	secret: config.cookie_secret,
	store: sessionStore
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.post('/reg', routes.reg);
app.post('/login', routes.login);
app.post('/logout', routes.logout);
app.post('/updateSig', routes.updateSig);
app.post('/updateImg', routes.updateImg);
app.post('/find', routes.find);
app.post('/addFriend', routes.addFriend);

mongoose.connect(config.dburl);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var Message = require('./models/message')
,	User = require('./models/user');

function addFriend(a, b) {
	User.findOneAndUpdate({name: a}, {$addToSet: {friends: b}}, function(err, user){
		if (err) {
			console.log(err);
			return ;
		}
		var u = user;
		u.friends = null;
		var data = {type: 6, msg: u};
		if (socketID[b]) {
			io.sockets.socket(socketID[b]).emit('message', data, function(onlineStatus){
				io.sockets.socket(socketID[b]).join(a);
				if (socketID[a]) {
					io.sockets.socket(socketID[a]).json.send({type: 0, from: b, msg: onlineStatus});
				}
			});
		} else {
			(new Message(data)).save(function(err){
				if (err) {
					console.log(err);
				}
			});
		}
	});
}

function removeFriend(a, b) {
	User.findOneAndUpdate({name: a}, {$pull: {friends: b}}, function(err){
		if (err) {
			console.log(err);
			return ;
		}
		if (socketID[a]) {
			io.sockets.socket(socketID[a]).json.send({type: 11, from: b});
		}
	});
}

//websocket设置session
io.set('authorization', function(handshakeData, accept){
	if (!handshakeData.headers.cookie) {
		return accept('no cookie.', false);
	}
	handshakeData.cookies = utils.parseSignedCookies(
			cookie.parse(handshakeData.headers.cookie),
			config.cookie_secret);
	sessionStore.get(handshakeData.cookies['connect.sid'], function(err, session){
		if (err || !session || !session.user) {
			return accept('no session.', false);
		}
		handshakeData.session = session;
		return accept(null, true);
	});
});

//socket
io.sockets.on('connection', function(socket) {
	var user = socket.handshake.session.user
	,	name = user.name;

	Message.find({to: name, read: 0}, function(err, messages){
		if (err) {
			console.log(err);
			return ;
		}
		if (messages) {
			messages.forEach(function(p){
				p.read = 1;
				p.save();
				var res = {type: p.type, from: p.from, msg: p.msg};
				if (p.inDate) {
					res.inDate = p.inDate;
				}
				if (p.type == 4 || p.type == 5) {
					User.findOne({name: p.from}, function(err, u){
						if (err) {
							console.log(err);
							return ;
						}
						res.user = {
							name: u.name,
							nick: u.nick,
							birthday: u.birthday,
							sex: u.sex,
							img: u.img,
							imgFormat: u.imgFormat
						};
						socket.json.send(res);
					});
				} else {
					socket.json.send(res);
				}
			});
		}
	});

	socketID[name] = socket.id;

	socket.join(name);
	if (user.friends) {
		user.friends.forEach(function(p){
			socket.join(p);
		});
	}

	socket.on('message', function(data, fn){
		var type = parseInt(data.type, 10);
		if (nan(type) || type == 6) {
			return ;
		}
		var res = { type: type, from: name, msg: data.msg }, save = false, send = true;
		if (data.to) {
			if (type == 1 || type == 4) {
				res.inDate = (new Date()).getTime();
				if (fn) fn(res.inDate);
				save = true;
			} else if (type == 5) {
				if (data.msg) {
					Message.update({type: 4, from: data.to, to: name, read: 1, inDate: data.inDate}, {$set: {read: data.msg.result}}, function(err, msg){
						if (err) {
							console.log(err);
							return ;
						}
						if (fn) fn(true);
						if (msg) {
							addFriend(name, data.to);
							addFriend(data.to, name);
						}
					});
				}
			} else if (type == 7 || type == 8) {
				save = true;
			} else if (type == 11) {
				removeFriend(name, data.to);
				removeFriend(data.to, name);
				send = false;
			}
			if (send) {
				if (socketID[data.to]) {
					if (type == 4 || type == 5) {
						res.user = {
							name: name,
							nick: user.nick,
							birthday: user.birthday,
							sex: user.sex,
							img: user.img,
							imgFormat: user.imgFormat
						};
					}
					io.sockets.socket(socketID[data.to]).json.send(res);
					res.read = 1;
				} else {
					res.read = 0;
				}
			}
			if (save) {
				res.to = data.to;
				(new Message(res)).save(function(err){
					if (err) {
						console.log(err);
					}
				});
			}
		} else {
			io.sockets.in(name).json.send(res);
		}
	});

	socket.on('changeInfo', function(data, fn){
		var nick = String(data.nick)
		,	sex = parseInt(data.sex, 10)
		,	birthday = parseInt(data.birthday, 10);
		if (!nick || nick.length > 24 || nan(sex) || nan(birthday) || !birthday) {
			return ;
		}
		var info = {
			nick: nick,
			signature: String(data.signature),
			sex: sex,
			birthday: birthday,
			city: String(data.city)
		};
		User.findOneAndUpdate({name: name}, {$set: info}, function(err, user){
			if (err) {
				console.log(err);
				fn(false);
			} else {
				if (user.signature != info.signature) {
					io.sockets.in(name).json.send({type: 2, from: name, msg: info.signature});
				}
				if (user.nick != info.nick) {
					io.sockets.in(name).json.send({type: 12, from: name, msg: info.nick});
				}
				fn(true);
			}
		});
	});

	socket.on('disconnect', function(){
		io.sockets.in(name).json.send({type: 0, from: name});
		socketID[name] = null;
	});
});
