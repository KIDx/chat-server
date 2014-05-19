
/**
 * 返回值说明：
 * 'e' : 'system error'
 * 'n' : 'not allow'
 */

var User = require('../models/user')
,	ID = require('../models/id')
,	crypto = require('crypto');

function nan(n) {
	return n != n;
}

function nil(n) {
	return (typeof(n) == 'undefined');
}

function trim(s) {
	if (nil(s)) return '';
	return String(s).replace(/(^\s*)|(\s*$)/g, '');
}

function drim(s) {
	if (nil(s)) return '';
	return String(s).replace(/(\s+)/g, ' ');
}

//delete unuseful ' ', '\t', '\n' ect...
//eg: "	 " -> " "
function clearSpace(s) {
	return drim(trim(s));
}

//delete All ' ', '\t', '\n' ect...
//eg: "	" -> ""
function clearAllSpace(s) {
	if (nil(s)) return '';
	return String(s).replace(/(\s+)/g, '');
}

exports.login = function(req, res) {
	res.header('Content-Type', 'text/plain');
	var name = String(req.body.name)
	,	psw = String(req.body.psw);
	if (!name || !psw) {
		return res.end('n');	//not allow
	}
	User.findOne({
		name: name,
		password: crypto.createHash('md5').update(psw).digest('base64')
	}, function(err, user){
		if (err) {
			console.log(err);
			return res.end('e');
		}
		if (!user) {
			return res.end('1');
		}
		User.find({name: {$in: user.friends}}, function(err, users){
			if (err) {
				console.log(err);
				return res.end('e');
			}
			req.session.user = user;
			return res.json([user, users]);
		});
	});
};

exports.reg = function(req, res) {
	res.header('Content-Type', 'text/plain');
	var nick = clearSpace(req.body.nick)
	,	sex = parseInt(req.body.sex, 10)
	,	psw = String(req.body.psw)
	,	birthday = (new Date(String(req.body.birthday))).getTime();

	if (!nick || nan(sex) || !psw || !birthday) {
		return res.end();	//not allow
	}

	ID.get('username', function(err, name){
		if (err) {
			console.log(err);
			return res.end('e');
		}
		(new User({
			name		: name,
			nick		: nick,
			sex 		: sex,
			birthday 	: birthday,
			password	: (crypto.createHash('md5')).update(psw).digest('base64'),
			regTime	 	: (new Date()).getTime()
		})).save(function(err) {
			if (err) {
				console.log(err);
				return res.end('e');
			}
			return res.end(name);
		});
	});
};

exports.logout = function(req, res) {
	req.session.user = null;
	return res.end();
};

exports.updateSig = function(req, res) {
	res.header('Content-Type', 'text/plain');
	if (!req.session.user) {
		return res.end();	//illegal
	}
	var sig = clearSpace(req.body.sig);
	User.update({name: req.session.user.name}, {$set: {signature: sig}}, function(err){
		if (err) {
			console.log(err);
			return res.end('e');
		}
		return res.end();
	});
};

exports.updateImg = function(req, res) {
	res.header('Content-Type', 'text/plain');
	if (!req.session.user) {
		return res.end();	//illegal
	}
	var name = req.body.name
	,	format = req.body.format;
	User.findOneAndUpdate({name: req.session.user.name}, {$set: {img: name, imgFormat: format}}, function(err){
		if (err) {
			console.log(err);
			return res.end('e');
		}
		return res.end();
	});
};

exports.addFriend = function(req, res) {
	res.header('Content-Type', 'text/plain');
	if (!req.session.user) {
		return res.end();	//illegal
	}
	var name = req.body.name;
	if (!name) {
		return res.end('n');
	}
	User.findOne({name: name}, function(err, user){
		if (err) {
			console.log(err);
			return res.end('e');
		}
		if (!user) {
			return res.end('n');
		}
		User.update({name: req.session.user.name}, {$addToSet: {friends: name}}, function(err){
			if (err) {
				console.log(err);
				return res.end('e');
			}
			return res.end();
		});
	});
};