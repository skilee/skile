var express = require('express');
var app=express();
var cookieParser=require('cookie-parser');
var bodyParser=require('body-parser');
var cookieSession=require('cookie-session');
var port = process.env.PORT || 3000;
app.set('title','Skile');
app.locals.title='Skile';
var MongoClient=require('mongodb').MongoClient;
var toSkip;//how many to skip in categories
var limitCat=2;
var db;//go get access to db outside connect
MongoClient.connect("mongodb://skile:skilland@kahana.mongohq.com:10089/skile",function(err,database){
	if(!err){
		console.log("We are connected");
		db=database;
	}
});
app.use(bodyParser());
app.use(cookieParser('SuCrEeT'));
app.use(cookieSession({keys:['sec1','sec2']}));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'jade');
//middleware to check if user logged in or not
var isLoggedIn = function(req, res, next) {
  if (req.session && req.session.user)
    next(); // user logged in, so pass
  else
    res.redirect('/login'); // not logged in, redirect to login page
};
app.get('/',function(req,res){
	if(req.session&&req.session.user){		
		res.render('home2');
	}
	else{
		res.render('home');
	}
});
app.get('/login',function(req,res){
	if(req.session&&req.session.user){		
		res.redirect('/');
	}
	else{		
		res.render('login');
	}
});
app.post('/login',function(req,res){
	var found=false;
	var user=req.body.user;
	var pass=req.body.pass;
	db.collection('skile').find({username:user,password:pass}).toArray(function(err,items){
		if(!err){
			for(var i=0;i<items.length;i++){
				if(items[i].username==user&&items[i].password==pass){
					found = true;
					req.session.user=items[i].username;
					req.session.pass=items[i].password;
				}
			}
			}else{
				console.log(err);
			}
			if(found==true){
				res.redirect('/profile');
			}else{
				res.redirect('/login');
			}
			
		
	});
});

app.post('/register',function(req,res){
	var user={
		username:req.body.user,
		password:req.body.pass,
		email:req.body.email
	}
	db.collection('skile').insert(user,function(err,result){
		if(err){
			res.send(err);
		}
		else{
			res.redirect('login');
		}
	});
});
app.get('/register',function(req,res){
	res.render('register');
});
app.get('/profile',isLoggedIn,function(req,res){
	db.collection('skile').findOne({username:req.session.user,password:req.session.pass},function(err,doc){
		if(!err){
			res.render('profile',{doc:{user:String(doc.username),pass:doc.password,email:doc.email}});
		}
	});
});
app.get('/category',isLoggedIn,function(req,res){
	db.collection('category').find().toArray(function(err,items){
		res.render('category',{items:items});
	});
});
app.get('/create',isLoggedIn,function(req,res){
	res.render('create');
});
app.post('/create',isLoggedIn,function(req,res){
	var title=req.body.title;
	var desc=req.body.description;
	var whycat=req.body.whycat;
	var admin=req.body.admin;
	var date=(new Date()).toJSON();

	var id;
	db.collection('skile').findOne({username:req.session.user,password:req.session.pass},function(err,doc){
		if(!err){
			id=doc._id;
			console.log(id);
		
	category={
		creatorId:id,//creator
		title:title,
		description:desc,
		whyCategory:whycat,
		admin:admin, //0 for no,1 for yes
		createdOn:date
	}
	db.collection('category').insert(category,function(err,result){
		if(err){
			res.send(err);
		}
		else{
			res.redirect('/category');
		}
		});

	}
});
});
app.get('/logout',function(req,res){    
	req.session=null;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
    res.redirect('/');   
});/*
app.get('/islogged',function(req,res){
	if(req.session&&req.session.user){
		res.send('true');
	}else{
		res.send('false');
	}
});*/
app.get('/category/:title',function(req,res){
	var title=req.param('title');
	db.collection('category').findOne({title:title},function(err,item){
		res.render('catpage',{category:{title:title,description:item.description}});
	});
});
app.get('/limitcat',function(req,res){
	res.send({limitCat:limitCat});
});	/*	
app.get('/next/:current',function(req,res){
	var current=req.param('current');
	console.log(toSkip);
});*/
app.post('/next/:toskip',function(req,res){
	toSkip=req.param('toskip')*2;
	db.collection('category').find({},{},{skip:toSkip,limit:limitCat}).toArray(function(err,items){
		res.send(items);
	});
});
app.get('/links',function(req,res){
	db.collection('links').find().toArray(function(err,items){
		if(err){
			res.send(err);
		}else{
			console.log(items[0]);
			res.render('links',{items:items});
		}
	});
});
app.get('/links/:category',function(req,res){	
	var  category=req.param('category');
	res.render('links',{category:category});
});
app.post('/links',isLoggedIn,function(req,res){
	var url=req.body.url;
	var category=req.body.category;
	var description=req.body.description;
	var tags=req.body.tags.split(',');
	var title = new RegExp("^" + category + "$",'i');
	console.log(title);
	db.collection('category').findOne({title:title},function(err,item){
		var id=item._id
	var link={
		url:url,
		category:category,
		catId:id,
		username:req.session.user,
		tags:tags
	}
	db.collection('links').insert(link,function(err,result){
		if(err){
			res.send(err);
		}else{
			res.redirect('/links/'+category);
		}
	});
	});
});
var server = app.listen(port,function(){
	console.log('Listening on port %d',port);
});