const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');
const server_address = 'localhost';
const port = 3000;
let html_stream;
let image_stream;
const auth_cache = './auth/authentication_res.json';
const img_path = './artists/';
//Generating the Credentials for auth with spotify
//Grabbing the client info from json file and parsing the json file
let cred = fs.readFileSync('./auth/credentials.json', 'utf8');
const credentials = JSON.parse(cred);
//creating the object to store all the info for Client Credentials Flow
let post_data = {
    client_id : credentials.client_id,
    client_secret : credentials.client_secret,
    grant_type : "client_credentials"
} 
//Generating the string for the post request from credentials object
post_data = querystring.stringify(post_data);

//Generating the POST request
const options = {
    method : 'POST',
    hostname: 'accounts.spotify.com',
    path: '/api/token',
    'headers':{
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length' : post_data.length
    }
}

function recieved_auth(auth_res,res,user_input,request_sent_time){
    auth_res.setEncoding("utf8");
    let body = "";
    auth_res.on("data", data=>{body+=data});
    auth_res.on("end", ()=>{
        let auth_res_data = JSON.parse(body);
        request_sent_time.setHours(request_sent_time.getHours()+1);
        auth_res_data.expiration = request_sent_time;

        console.log(auth_res_data);
        create_cache(auth_res_data);
        console.log("new cache");
        create_search_req(auth_res_data, res, user_input);
    });
}

function  recieved_search(search_res, res){
    search_res.setEncoding('utf8');
    let body = "";
    search_res.on("data", data=>{body+=data});
    search_res.on("end", ()=>{
        let search_res_data = JSON.parse(body);
        let artist = {
            name: search_res_data.artists.items[0].name,
            genre: search_res_data.artists.items[0].genres,
            image: search_res_data.artists.items[0].images[0].url
        }
        let img_path_name = img_path + artist.name+'.png';
        if(fs.existsSync(img_path_name)){
            console.log("image already exists");
            let webpage = '<h1>${artist.name}</h1><p>${artist.genre.join()}</p><img src="${img_path_name}" />';
            res.end(webpage);
        }else{
            let img_req = https.get(artist.image, image_res=>{
                let new_img = fs.createWriteStream(img_path_name, {'encoding': null});
                image_res.pipe(new_img);
                new_img.on('finish', ()=>{
                    console.log("image cache");
                    let webpage = '<h1>${artist.name}</h1><p>${artist.genre.join()}</p><img src="${img_path_name}" />';
                });
            });
        }
        
    });
}

function create_cache(auth_res_data){
    let cacheJSON = JSON.stringify(auth_res_data);
    fs.writeFile(auth_cache, cacheJSON, (error)=>{
        if(error){
            console.log("Error in saving");
            throw error;
        }
        console.log('The file has been saved');
    });
}

function create_search_req(auth_res_data, res, user_input){
    let request_param = {
        access_token : auth_res_data.access_token,
        q : user_input.artist,
        type : 'artist'
    }
    let search_req_url = 'https://api.spotify.com/v1/search?'+querystring.stringify(request_param);
    console.log(search_req_url);
    let search_req = https.request(search_req_url, (search_res)=>{
        recieved_search(search_res, res);
    });
    search_req.end();
}

let server = http.createServer((req,res)=>{
    if(req.url==="/"){
        html_stream = fs.createReadStream('./html/search-form.html','utf8');
        console.log(`A new request was made from ${req.connection.remoteAddress} for ${req.url}`);
        res.writeHead(200,{'Content-Type':'text/html'});
        html_stream.pipe(res);
    }
    if(req.url.includes('/favicon.ico')){
        console.log('Error 404 not found');
        res.writeHead(404);
        res.end();
    }
    if(req.url.includes('/search')){
        console.log(`A new request was made from ${req.connection.remoteAddress} for ${req.url}`);
        let user_input = url.parse(req.url,true).query;
        let cache_json;
        let cache_valid = false;
        if(fs.existsSync(auth_cache)){
            let cache_content = fs.readFileSync(auth_cache, 'utf-8');
            cache_json = JSON.parse(cache_content);
            if(new Date(cache_json.expiration) > Date.now()){
                cache_valid = true;
            }else{
                console.log("Token expired");
            }
        }
        if(cache_valid){
            console.log("already cache");
            create_search_req(cache_json, res, user_input);
        }else{
            let request_sent_time = new Date();
            let auth_req = https.request(options ,(auth_res)=>{
                recieved_auth(auth_res,res,user_input,request_sent_time);
            });
            auth_req.on('error', (e)=>{
                console.log(e);
            });
            auth_req.write(post_data);
            console.log("Requesting Token");
            auth_req.end();
        }

        // html_stream = fs.createReadStream('./html/search-form.html','utf8');
        // res.writeHead(200,{'Content-Type':'text/html'});
        // html_stream.pipe(res);
    }
    if(req.url.includes('/artists/')){
        console.log('artisit');
        image_stream = fs.createReadStream('./artists/arcticmonkeys.jpeg');
        res.writeHead(200,{'Content-Type':'image/jpeg'});
        image_stream.pipe(res);
    }
});

console.log('Now listening on port ' + port);
server.listen(port,server_address);