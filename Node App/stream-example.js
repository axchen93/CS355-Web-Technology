let fs = require('fs');

//Read from input.txt and pipe to output.txt

let myReadStream = fs.createReadStream('input.txt');
let myWriteStream = fs.createWriteStream('output.txt');
myReadStream.pipe(myWriteStream);


/*

//Read from input.txt and chunk by chunk write to output.txt

let myReadStream = fs.createReadStream('input.txt');
let myWriteStream = fs.createWriteStream('output.txt');
myReadStream.on('data',(chunk)=>{
	console.log('A new chunk was recieved');
	myWriteStream.write(chunk);
});

*/

