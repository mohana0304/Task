const { createServer } = require("node:http");

const http=require('http');

const server=createServer((req,res)=>{
    if(err) res.send(err);
    res.send("connected");
});

server.listen(3000,()=>{
    console.log('server running on port 3000');
});
