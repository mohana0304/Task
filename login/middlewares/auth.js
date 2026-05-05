//Authorization middleware (access control) - what the user is allowed to access like admin/user


const jwt=require('jsonwebtoken');
exports.auth= (roles = [])=>{
    return (req,res,next)=>{
        const token = req.cookies.token;

        if(!token) return res.send('No token');
        try{
            const decoded= jwt.verify(token,'secretkey');

            if(roles.length && !roles.includes(decoded.role)){
                return res.send('Access denied');
            }
            req.user=decoded;
            next();
        }catch{
            res.send('Invalid token');
        }
    };
};
