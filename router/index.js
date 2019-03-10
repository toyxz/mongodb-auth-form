var userSchema = require('../modal/user.js');
var crypto = require('crypto');

module.exports = function(app) {
    app.get('/', function(req,res,next) {
        if (req.session && req.session.user) {
            res.render('index', {authenticated: true});
        } else {
            res.render('index', {authenticated: false});
        }
    });
    // login的中间件 （不能使用单独函数名，会报错）
    app.get('/login',function(req,res,next){
        if (req.session && req.session.user) {
            req.flash('error','已登录');
            return res.redirect('/');
        }
        next();
    });
    app.get('/login', function(req,res,next) {    // 登录
        res.render('login');
    });
    app.post('/login', function(req,res,next) {    // 登录
        //先查询有没有这个user
        var UserName = req.body.userName;
        var UserPsw = req.body.userPwd;
        // 加密
        var md5 = crypto.createHash('md5');
        var newPas = md5.update(UserPsw).digest('hex');
        // 通过账号密码搜索验证
        var updatestr = {username: UserName,userpsw:newPas};
          //处理跨域的问题
        res.setHeader('Content-type','application/json;charset=utf-8')
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
        res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
        res.header("X-Powered-By",' 3.2.1');
        userSchema.find(updatestr, function(err,obj) {
            if (err) {
                return req.flash('error',err);
            } else {
                if (obj.length == 1) {  
                    req.session.user = obj;  // 登录之后可以这样设置session返回浏览器
                    req.flash('success','登录成功');
                    res.redirect('/');   // 登录成功
                } else {
                    req.flash('error','登录失败');
                    res.redirect('/signup');
                }
            }
        });
    });
    // signup的中间件
    app.get('/signup',function(req,res,next){
        if (req.session && req.session.user) {
            req.flash('error','已登录');
            return res.redirect('/');
        }
        next();
    });
    app.get('/signup', function(req,res,next) {   // 注册
        res.render('signup');
    });
    app.post('/signup', function(req,res,next) {   // 注册
        //处理跨域的问题
        res.setHeader('Content-type','application/json;charset=utf-8')
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
        res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
        res.header("X-Powered-By",' 3.2.1');// 如果用的node express框架，那么X-Powered-By就会显示Express
        //先查询有没有这个user
        var UserName = req.body.userName;
        var UserPsw = req.body.userPwd;
        var email = req.body.useremail;
        var updatestr = {username: UserName};
        // 加密
        var md5 = crypto.createHash('md5');
        var newPas = md5.update(UserPsw).digest('hex');

        userSchema.find(updatestr, function(err,obj) {
            if (err) {
                return req.flash('error',err);
            } else {
                if (obj.length == 0) {   // 查出来是一个数组
                    // 查不到数据，插入数据库
                    insert(res,req,UserName,newPas,email,function(err,user){
                        if (err) {
                            req.flash('error','注册失败');
                            res.redirect('/signup');
                        } else {
                            req.flash('success','注册成功');
                            res.redirect('/login');   // 注册成功返回主页（不要返回/login，因为此时login路由中有redirect，会导致服务器返回两次而出错）
                        }
                    });
                    
                } else if (obj.length != 0) {
                    req.flash('error','用户名已注册');
                    res.redirect('/signup');
                }
            }
        });
    });
    // logout的中间件
    app.get('/logout',function(req,res,next) {
        if (!req.session || !req.session.user) {
            req.flash('error','未登录');
            return res.redirect('/login');
        }
        next();
    }); // 在退出之前要判断是否处在登录状态，如果没有在登录状态，这里是不能处理的 做授权（防止直接使用URL）
    app.get('/logout',function(req,res,next){
        req.session.user = null;
        req.flash('success','登出成功');
        res.redirect('/');
    });
    // 插入数据库函数
    function insert(res,req,name,psw,nick,cb){
        //数据格式
        var user =  new userSchema({
            username : name,
            userpsw : psw,
            nickname : nick,
            logindate : new Date()
        });
        user.save(function(err,user){
            if(err){
                cb(err,user);
            }
            else {
                cb(null,user);
            }
        });
    }
};



// session设置在req中