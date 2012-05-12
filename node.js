var express = require('express')
    , fs = require('fs');

// ---

var app
    , public = __dirname + '/src';

// ---

app = express.createServer();

// ---

app.configure(function() {
    app.use(express.static(public));
    app.use(app.router);
    app.listen(3000);
});

// ---

app.get('/', function(req, res) {

	res.send('Superbook.js');

});

// ---

app.get('/tests', function(req, res) {

	fs.readFile(public + '/tests/index.html', 'utf8', function(err, html){
		res.send(html);
	});

});

// ---

app.get('/examples/connect/:name', function(req, res) {

	fs.readFile(public + '/examples/connect/' + req.params.name + '/index.html', 'utf8', function(err, html){
		res.send(html);
	});

});

app.get('/examples/sdk/:name', function(req, res) {

	fs.readFile(public + '/examples/sdk/' + req.params.name + '/index.html', 'utf8', function(err, html){
		res.send(html);
	});

});



