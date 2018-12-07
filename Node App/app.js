const server_ip = '68.183.128.45';
const port = 80;
let http = require('http');
let fs = require('fs');
let myReadStream = fs.createReadStream('home.html','utf8');

let server = http.createServer((req,res)=>{
	let ip = req.connection.remoteAddress
	console.log('A new request was made from ' + ip);
	res.writeHead(200,{'Content-Type':'text/html'});
	myReadStream.pipe(res);
	
});

console.log('Now listening on port ' + port);
server.listen(port,server_ip);
