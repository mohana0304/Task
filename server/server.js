const { createServer } = require("node:http");

const http=require('http');
const PORT=3000;
const server=createServer((req,res)=>{
    if(err) res.send(err);
    res.send("connected");
});

server.listen(PORT,()=>{
    console.log(`server running on port ${PORT}`);
});
