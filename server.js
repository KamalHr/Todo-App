
var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');
var session      = require('express-session');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var Todo     = require('./app/Todo');
var User     = require('./app/User');
var cors = require('cors');
var port = process.env.PORT || 3000;
var passport = require('passport')
var LocalStrategy   = require('passport-local').Strategy;
var path = require('path');
passport.use( new LocalStrategy(
  	function(username, password, done) {
	    User.findOne({ username: username }, function(err, user) {
	      	if (err) { 
	      		return done(err); }
	      	if (!user) {
	        	return done(null, false, { message: 'Incorrect username.' });
	      	}
	      	if (!user.validPassword(password)) {
	        	return done(null, false, { message: 'Incorrect password.' });
	      	}
	      	return done(null, user);
	    });
  	}
));
passport.use('local-signup', new LocalStrategy({
    username : 'username',
    password : 'password',
    passReqToCallback : true // allows us to pass back the entire request to the callback
},
function(req, username, password, done) {
    User.findOne({ 'username' :  username }, function(err, user) {
        if (err){
            return done(err);
        }
        if (user) {
            return done(null, false,{'signupMessage': 'Username already taken.'});
        } else {
        	console.log("Creating new user");
            var newUser            = new User();
            newUser.username    = username;
            newUser.password = newUser.generateHash(password);
            newUser.save(function(err) {
                if (err)
                    throw err;
                return done(null, newUser);
            });
        }
    });    
}));

passport.serializeUser(function(user, done) {
	console.log("serializeUser");
  	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  	User.findById(id, function(err, user) {
  		console.log("deserializeUser");
    	done(err, user);
  	});
});

mongoose.connect('localhost/New');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser())
//app.use(cors());
app.use(session({ secret: "keyboard cat", cookie: { maxAge: 6000000 }, rolling: true,resave: true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());
var router = express.Router();
app.use(express.static(__dirname + '/public'));

var isLogged = function(req, res, next){
	if(req.isAuthenticated())
		return next();
	return res.status(401).send('Not logged in');
};
router.get('/loggedin', function(req, res) {
	if(req.isAuthenticated()){
  		return res.send(req.user);
	}
	else{
		return res.status(401).send('Not logged in');
	}
});

router.post('/login', function(req, res, next) {
  	passport.authenticate('local',{session: true}, function(err, user, info) {
	    if (err) {
	      return next(err);
	    }
	    if (! user) {
	      	return res.status(401).send({ success : false, message : 'authentication failed' });
	    }
	    req.logIn(user, loginErr => {
	      	if (loginErr) {
	        	return next(loginErr);
	      	}
	      	return res.send(req.user);
	    });     
  	})(req, res, next);
});
router.post('/signup', function(req, res, next) {
  	passport.authenticate('local-signup', function(err, user, info) {
	    if (err) {
	      return next(err);
	    }
	    if (user) {
	      	return res.send({ success : false, message : 'signup failed',info: info });
	    }
	    req.login(user, loginErr => {
	      if (loginErr) {
	        return next(loginErr);
	      }
	      return res.send({ success : true, message : 'authentication succeeded' });
	    });      
  	})(req, res, next);
});
// route to log out
router.post('/logout', function(req, res){
  	req.logOut();
  	res.status(200).send("Logged out");
});
router.get('/todos', function(req, res) {
	if(req.isAuthenticated())
		Todo.find({$or: [ { public: true }, { owner: req.user._id } ]},function(err, todos) {
	        if (err){
	            res.send(err)
	        }
	        res.json(todos);
	    }); 
	else
	  	Todo.find({ public: true },function(err, todos) {
	        if (err){
	            res.send(err)
	        }
	        res.json(todos);
	    }); 
});
router.post('/todos',isLogged,function(req, res){
	Todo.create({
		name: req.body.name,
		desc: req.body.desc,
		done: false,
		owner: req.user._id,
		public: req.body.public,
		ownerName: req.user.username
	}, function(err){
		if(err){
			res.send(err);
		}
		Todo.find({$or: [ {public: true},{owner: req.user._id}]},function(err,todos){
			if(err){
				res.send(err);
			}
			res.json(todos);
		});
	});
});
router.get('/todos/:id',isLogged,function(req,res){
	Todo.find({$and: [{_id: req.params.id},{$or: [{public: true},{owner: req.user._id}]}]},function(err,todo){
		if(err){
			return res.status(500).send({ error: err });
		}
		res.json(todo);
	});
});
router.put('/todos/:id',isLogged,function(req,res){
	Todo.findOneAndUpdate(
		{_id: req.params.id, owner: req.user._id}, 
		{name: req.body.name, desc: req.body.desc, done: req.body.done, public: req.body.public}, 
		{upsert:true}, 
		function(err, todo){
    		if (err){
				return res.status(500).send({ error: err });
    		}  
    		console.log("Updated");  			
    		Todo.find({$or: [{public: true},{owner: req.user._id}]},function(err,todos){
				if(err){
					res.send(err);
				}
				res.json(todos);
			});
		}
	);
});
router.put('/todos',isLogged,function(req,res){
	Todo.update(
		{owner: req.user._id}, 
		{done: req.body.done}, {multi: true},
		function(err, todo){
    		if (err){
				return res.status(500).send({ error: err });
    		}  
    		console.log("All Updated");  			
    		Todo.find({$or: [{public: true},{owner: req.user._id}]},function(err,todos){
				if(err){
					res.send(err);
				}
				res.json(todos);
			});
		}
	);
});	
router.delete('/todos/:id',isLogged,function(req,res){
	Todo.remove({
		_id: req.params.id,
		owner: req.user._id
	}, function(err,todo){
		if(err){
			res.send("Item Already deleted or not found");
		}
		Todo.find({$or: [{public: true},{owner: req.user._id}]},function(err,todos){
			if(err){
				res.send(err);
			}
			res.json(todos);
		});
	});
});
app.get('/', function(req, res){
  	 res.sendfile('./public/index.html');
});

app.use('/', router);
app.listen(port);
console.log('Magic happens on port ' + port);