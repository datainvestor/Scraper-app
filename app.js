var express = require("express")
var session = require('express-session')
var MongoStore = require('connect-mongo')(session);
var app = express()
var request = require("request")
var PythonShell = require('python-shell');
require('dotenv').config()
app.set("view engine", "ejs")
app.engine('html', require('ejs').renderFile);
app.use(express.static("public")); 

var sessionOptions = {
  secret: process.env.SECRET_KEY,
  resave : true,
  saveUninitialized : false,
  store: new MongoStore({
    url:process.env.DB
    //other advanced options
  })
};

app.use(session(sessionOptions));


//var thelist =[]
//var jsondata = ""

app.get("/", function(req, res, next){
    req.session.views = (req.session.views || 0) + 1
    req.session.thelist = (req.session.thelist || [])
    req.session.jsondata= (req.session.jsondata || "")
  // Write response
    console.log(req.session.views + ' views')
    console.log(req.session.thelist)
    console.log(req.session.jsondata.length > 2)
    var done = req.session.jsondata.length > 2
    res.render("search", {done: done})
    //res.end('views')
})



app.get("/results", function(req, res, next){
    var query = req.query.search
    var url = "http://www.omdbapi.com/?s=" + query + "&type=series&apikey=thewdb"
    req.session.views=0
    console.log(req.session.views)
    request(url, function(error, response, body){
        var data = JSON.parse(body)
        if(!data["Error"] && response.statusCode == 200){
            res.render("results", {data: data})
            //var pyvar = data["Search"][0]["imdbID"]
            //console.log(pyvar)

            //var pyshell = new PythonShell('script2.py');
            //pyshell.send(JSON.stringify(pyvar))
            //pyshell.on('message', function (message) {
    // received a message sent from the Python script (a simple "print" statement)
            //jsondata += message
            //});

// end the input stream and allow the process to exit
            //pyshell.end(function (err) {
            // if (err){
               // throw err;
                //};

            //console.log('finished');
        } else {
            res.redirect("/");
        }
    })
})



app.get("/show/:id", function (req, res, next) {
    var id = req.params.id;
    req.session.thelist.push(id)
    console.log(req.session.thelist);
    res.redirect('/')
});

app.get("/run", function(req, res, next) {
    //console.log(JSON.stringify(req.session.thelist).length + " check uno")
    // check if thelist is empty or not, if it is then go  ahead and update jsonfile from python, else just redirect back
            if (JSON.stringify(req.session.thelist).length > 2) {
            var pyshell = new PythonShell('script.py');
            pyshell.send(JSON.stringify(req.session.thelist))
            pyshell.on('message', function (message) {
    // received a message sent from the Python script (a simple "print" statement)
    // but first check if jsondata is empty (first run of the session), if not then empty it and then update
            if (req.session.jsondata == "") {
                console.log(req.session.jsondata + " check1")
                req.session.jsondata += message
            } else {
                console.log(req.session.jsondata + " check2")
                req.session.jsondata = ""
                console.log(req.session.jsondata + " check3")
                req.session.jsondata += message
                console.log(req.session.jsondata + " check4")
            }
            res.redirect("/")
            });

// end the input stream and allow the process to exit
            pyshell.end(function (err) {
             if (err){
               throw err;
                };
            //console.log(req.session.jsondata + " inside");
            });
            } else {
                res.redirect("/")
            }
            
});


app.get('/data', function(req, res, next) {
    //display data from the json file and empty thelist
    req.session.thelist = []
    console.log(req.session.thelist + ' views from /dat')
    if (req.session.jsondata == "") {
        console.log("its empty")
        res.redirect('/')
    } else {
    //viewname can include or omit the filename extension
    res.render("data", {data: JSON.parse(req.session.jsondata)} )
    //res.end('View counter has been reset to 0' )
    }
});




app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Movie App has started!!!");
})
