const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const express = require('express');
const app = express(); 
const bodyParser = require('body-parser');
const urlParserEncoder = bodyParser.urlencoded({extended: false});

const con = mysql.createConnection({
    host: "localhost",
    user: "NodeJSProject",
    password: "Password14"
  });

con.connect(function(err) {
    if (err) {
        throw err;
    } else {
        console.log("Connected!");
    }
});



app.set('view engine', 'ejs');
app.listen(3000);
app.use('/assets', express.static('assets'));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/loginpage.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'loginpage.html'));
});

app.post('/userpage.html', urlParserEncoder, (req, res) => {
        // meant to get a username and a password for verification. 
        con.query(`SELECT * FROM BlogProject.users WHERE username = '${req.body.username}'`, function (err, result, fields) {
           if (err) {
              res.sendFile(path.join(__dirname, 'public', 'usererror.html'));
              console.log(err.code);
              throw err; 
            } else {
                if (req.body.password === result[0].password) {
                    //needed because the primary key stored in blogs is userid instead of username, in order to potentially give users the ability to 
                    // change their username in the future
                    con.query(`SELECT userid FROM BlogProject.users where username = '${req.body.username}';`, (err, result, fields) => {
                        if (err) {
                            throw err; 
                        } else {
                            con.query(`SELECT title, absolutefilepath FROM BlogProject.blogs WHERE userid = ${result[0].userid} ORDER BY blogid`, (err, result, fields) => {
                                if (err) {
                                    throw err; 
                                } else {
                                    let blogarrays = []; 
                                    for (let i = 0; i < result.length; i++) {
                                       
                                        fs.readFile(result[i].absolutefilepath, 'utf8', (err, data) => {
                                            //since two columns will be returned, the SQL object will have a title and filepath property. 
                                            blogarrays.push({title: result[i].title, blog: data });
                                        })
                                    }
                                    // needed because asynchronous nature of query function was causing the render function to fire before the array was
                                    //populated. 
                                    setTimeout(function() {res.render(`${req.body.username}`, {user: req.body.username, 
                                        arr: blogarrays}); 
                                    }, 200);
                                }
                            })
                        }
                    }); 
                } else { 
                    res.sendFile(path.join(__dirname, 'public', 'passerror.html'));
                }       
            }
        });
});

app.post('/createblog.html', urlParserEncoder, (req, res) => {
        con.query(`SELECT * FROM BlogProject.users WHERE username = '${req.body.user}'`, function (err, result, fields) {
           if (err) {
              throw err; 
            } else {
                let id = result[0].userid; 
                // next two statements are separate for readability. 
                let filePath = __dirname + "/Users/" + req.body.user;
                let fileName = filePath + "/" + req.body.title + '.txt';
                // writes to new textfile in specific folder for later retrieval
                fs.writeFile(fileName, req.body.blog, (err) => {
                    if (err) {
                        throw err; 
                    }
                });
                // will be fixed once date is working
                fs.appendFile(fileName,`\n\n
                ${req.body.Date}`, (err) => {
                    if (err) {
                        throw err; 
                    }
                });
                //stores the filepath in the blog table for later use
                con.query(`INSERT INTO BlogProject.blogs (userid, absolutefilepath, title) VALUES ('${id}', '${fileName}', '${req.body.title}');`, function (err, result, fields) {
                    if (err) {
                        throw err; 
                    } else {
                        res.sendFile(path.join(__dirname, 'public', 'confirmblog.html'));
                    }
                })
            }
        });  
});

app.get('/createaccount.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'createaccount.html'));
});

app.post('/confirmationpage.html', urlParserEncoder, (req, res) => {
        const blogsfolder = __dirname + '/Users/' + req.body.user; 
        con.query(`Insert INTO BlogProject.users (username, password, blogsfolder) VALUES ('${req.body.user}', '${req.body.pass}',  '${blogsfolder}');`, function (err, result) {
           if (err) {
                if (err.code == 'ER_DUP_ENTRY') {
                    res.sendFile(path.join(__dirname, 'public', 'duplicateuserpage.html'));
                }
            } else {
                console.log("Result: " + result);
                // makes a directory to store the actual blogs of the particular user in the future
                fs.mkdir(blogsfolder, {}, (err) => {
                    if (err) {
                        throw err; 
                    }
                });
                const userpage = __dirname + '/Views/' + req.body.user + '.ejs';
                // creates the homepage of the user as an EJS file, the only personal characteristic at this point being their username, which is inserted below
                //possibly could have used a partial ejs file as a template instead of hardcoding but given that I would have to write up the file regardless
                //this at least allows one to see the exact code a second time. 
                fs.writeFile(userpage, `<!DOCTYPE html>
                <html lang="en">
                    <head> 
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta http-equiv="X-UA-Compatible" content="ie=edge">
                        <title>Document</title>
                        <link rel="stylesheet" type="text/css" href="../assets/basictemplate.css">
                        <script type="text/javascript" src="../assets/validate.js"> </script>
                    </head>
                    <body>
                        <h1> Welcome! ${req.body.user} </h1>
                        <% arr.forEach(function(params) {
                            %> 
                            <h3> <%= params.title %>  </h3>
                            <p> <%= params.blog %> </p>
                            <br />
                            <br />
                            <% }); %>
                        <form action="createblog.html" method="post"> 
                            <input type="hidden" value='<%=user%>' name="user">
                            <div name="reveal" style="visibility:hidden">
                                Title: <input type="text" name="title"> <br /> 
                                <textarea name="blog">Begin writing here...</textarea> <br />
                                <input type="submit" value="submit" name="finish"> <br />
                            </div>
                            <input type="hidden" name="Date" value="">
                            <br />
                            
                        </form>
                        <button onclick="createBlog()" id="blogbutton" style="visibility:visible"> Create Blog </button>
                        <br> <a id="footer" href="loginpage.html"> Log out </a>
                    </body>
                </html>`, function(err) {
                    if (err) {
                        throw err; 
                    }
                });
                res.sendFile(path.join(__dirname, 'public', 'confirmationpage.html'));
            }
        });
 }); 