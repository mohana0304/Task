//Authorization middleware (access control) - what the user is allowed to access like admin/user

const jwt=require('jsonwebtoken');
exports.auth= (roles = [])=>{
    return (req,res,next)=>{
        const token = req.cookies.token;

        if(!token) return res.redirect('/?error=Please login');
        try{
            const decoded= jwt.verify(token,'secretkey');

            if(roles.length && !roles.includes(decoded.role)){
                return res.redirect('/profile?error=Access denied');
            }
            req.user=decoded;
            next();
        }catch{
            return res.redirect('/?error=Invalid token');
        }
    };
};
