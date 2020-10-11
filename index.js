var express = require('express');
var app = express();
var pg = require('pg');
const cors = require('cors');
const  jwt  =  require('jsonwebtoken');
const port = 3030;
var bodyparser = require('body-parser');
var urlencodedparser = bodyparser.urlencoded({extended: false});

const SECRET_KEY = "secretkey23456";
app.use(cors());
app.use(bodyparser.json());

var conString = "postgres://ccxwntbr:v0LjdIFv-MKAEDOvF_fwhNXeT-Cxcwov@drona.db.elephantsql.com:5432/ccxwntbr";
var client = new pg.Client(conString);
client.connect();

app.post('/login', urlencodedparser, function(req,res){

    var username = req.body.username;
    var password = req.body.password;
    var Response = {};

         
         client.query('SELECT * FROM user_details WHERE username=$1 AND password=$2 LIMIT 1',[username,password], function (err, result){
            if(err){
                console.log('Insert error in signup', err);
            }
                    else{
                    if(result.rows.length!=0){
                        const expiresIn = 24 * 60 * 60;
                        const accessToken = jwt.sign({ id: result.rows.id }, SECRET_KEY, {
                            expiresIn: expiresIn
                        });
                        for (var i = 0; i < result.rows.length; i++) {
                            var row = result.rows[i];
                            user= row.user_id;
                            Response = {"status":200,"message":"Success","result":{ "user_id": row.user_id,"role":row.role, "token": accessToken, "expires_in": expiresIn }};
                          
                        }
                           // login_client.end();
                    }
                    else
                    {
                    Response = {"status":400,"message":"Invalid User"};
                   
                        
                   // login_client.end();
                    }
                }
                res.send(Response);
            });
    
  
   
 
  
});

app.post('/signup',urlencodedparser, function(req,response){
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    var role = req.body.role;
    var Response;
    client.query('INSERT INTO user_details(username,email,password,role) VALUES ($1,$2,$3,$4)',[username,email,password,role],(err,Result)=>{
        if(err)
        {
            Response = {"status": 400, "message":err};
        }
        else{
        
        Response={"status":200,"message":' User added successfully'}
      
        }
   })

   response.send(Response);
});

app.get('/get_list/:user_id',urlencodedparser, function(req,response){

    var user_id = req.params.user_id;
    var Response;
   
    client.query(`SELECT * FROM invoice_list WHERE user_id = ${user_id} ORDER BY invoice_date DESC`,(err,res)=>{
        if(err)
        {
            Response = {"status": 400, "message":err};
        }
        else{
            client.query('SELECT COALESCE(SUM(invoice_price),0) AS total FROM invoice_list WHERE user_id = ($1)',[user_id],(err,result)=>{
            if(err){
            }
            else{
            Response={"status":200,"message":"Success","result":{"data":res.rows,"sum":result.rows}};
            }
             response.send(Response);
        });
        }
        
    })
    
});
app.post('/checkuser',urlencodedparser,function(req,response){
    var Response;
    var user = req.body.username;
    
    client.query('select exists(select 1 from user_details where username =($1))',[user],(err,res)=>{
        if(err)
        {
            Response = {"status": 400, "message":err};
        }
        else{
        
        Response={"status":200,"message":' success',"result":res.rows}
      
        }
        response.send(Response);
        
    });

});

app.get('/get_username/:id',urlencodedparser,function(req,response){

    var user_id = req.params.id;
    var Response;
    client.query(`SELECT username FROM user_details WHERE user_id=${user_id}`,(err,res)=>{

        if(err)
        {
            Response = {"status": 400, "message":err};
        }
        else{
            Response={"status":200,"message":"Success","result":res.rows};
        }
        response.send(Response);
    });
});

app.get('/get_user_invoice/:id',urlencodedparser, function(req,response){

    var invoice_id = req.params.id;
    var Response;
    client.query(`SELECT invoice_id,invoice_name,invoice_date,invoice_price FROM invoice_list WHERE invoice_id = ${invoice_id} ORDER BY invoice_date DESC`,(err,res)=>{
        if(err)
        {
            Response = {"status": 400, "message":err};
        }
        else{
            Response={"status":200,"message":"Success","result":res.rows};
        }
        response.send(Response);
    });
    
});
app.post('/get_list_byuser',urlencodedparser, function(req,response){

    var user_id = req.body.user_id;
    var from = req.body.from_date;
    var to = req.body.to_date;
    var Response;
    client.query('SELECT * FROM invoice_list WHERE user_id = ($1) AND invoice_date BETWEEN ($2) AND ($3) ORDER BY invoice_date DESC',[user_id,from,to],(err,res)=>{
        if(err)
        {
            Response = {"status": 400, "message":err};
        }
        else{
            client.query('SELECT COALESCE(SUM(invoice_price),0) AS total FROM invoice_list WHERE user_id = ($1) AND invoice_date BETWEEN ($2) AND ($3)',[user_id,from,to],(err,result)=>{
                if(err)
                {
                 Response = {"status": 400, "message":err};
                }
                else{
                 Response={"status":200,"message":"Success","result":{"data":res.rows,"sum":result.rows}};
                }
                response.send(Response);
             });
            
        }
     
       
    });
    
});

app.post('/add_list',urlencodedparser,function(req,response){

    var user_id = req.body.user_id;
    var invoice_name = req.body.invoice_name;
    var invoice_date = req.body.invoice_date;
    var invoice_price = req.body.invoice_price;
    var Response;
    
    client.query('INSERT INTO invoice_list(user_id,invoice_name,invoice_date,invoice_price) VALUES ($1,$2,$3,$4)',[user_id,invoice_name,invoice_date,invoice_price],(err,result)=>{
        if(err)
        {
            Response = {"status": 400, "message":err};
        }
        else{
    
        Response = {"status": 200, "message":' Invoice added successfully'};
        }
        response.send(Response);
    });
    
});

app.put('/update_list',urlencodedparser,function(req,response){
    //var invoice_id = req.params.invoice_id;
    var invoice_id = req.body.invoice_id;
    var invoice_name = req.body.invoice_name;
    var invoice_date = req.body.invoice_date;
    var invoice_price = req.body.invoice_price;

    var Response;
    client.query('UPDATE invoice_list SET invoice_name = ($1),invoice_date= ($2),invoice_price= ($3) WHERE invoice_id =($4) ',[invoice_name,invoice_date,invoice_price,invoice_id],(err,result)=>{
        if(err)
        {
            Response = {"status": 400, "message":err};
        }
        else{
        
        Response = {"status": 200, "message":' Invoice updated successfully'};
        }
        response.send(Response);
    });
   
});

app.delete('/delete_list/:id',urlencodedparser,function(req,response){

    var invoice_id = req.params.id;
    var Response;
    client.query(`DELETE FROM invoice_list WHERE invoice_id=${invoice_id}`,(err,res)=>{
        if(err)
        {
            Response = {"status": 400, "message":err};
        }
        else{
            
        Response = {"status": 204, "message":' Invoice deleted successfully',"result":null};
        }
        response.send(Response);
    });
    
});
app.get('/userbardata/:id',urlencodedparser, function(req,response){

    var user_id = req.params.id;
    var Response;
    client.query('SELECT COUNT(1) AS invoices, DATE(invoice_date) as date FROM invoice_list WHERE user_id =($1) GROUP BY DATE(invoice_date)',[user_id],(err,res)=>{
        if(err)
        {
            Response = {"status": 400, "message":err};
        }
        else{
            Response={"status":200,"message":"Success","result":res.rows};
        }
        response.send(Response);
    });
    
});

app.get('/admin_list',urlencodedparser, function(req,response){
 
    var Response;
    client.query('SELECT * FROM invoice_list ORDER BY invoice_date DESC',(err,res)=>{
        if(err)
        {
            Response = {"status": 400, "message":err};
        }
        else{
            client.query('SELECT COALESCE(SUM(invoice_price),0) AS total FROM invoice_list',(err,result)=>{
               if(err)
               {
                Response = {"status": 400, "message":err};
               }
               else{
                Response={"status":200,"message":"Success","result":{"data":res.rows,"sum":result.rows}};
               }
              
               response.send(Response);
            });
        }
    });


});
app.post('/get_list_byadmin',urlencodedparser, function(req,response){

    var from = req.body.from_date;
    var to = req.body.to_date;
    var Response;
    client.query('SELECT * FROM invoice_list WHERE invoice_date BETWEEN ($1) AND ($2) ORDER BY invoice_date DESC',[from,to],(err,res)=>{
        if(err)
        {
            Response = {"status": 400, "message":err};
        }
        else{

            client.query('SELECT COALESCE(SUM(invoice_price),0) AS total FROM invoice_list WHERE invoice_date BETWEEN ($1) AND ($2)',[from,to],(err,result)=>{
                if(err)
                {
                 Response = {"status": 400, "message":err};
                }
                else{
                 Response={"status":200,"message":"Success","result":{"data":res.rows,"sum":result.rows}};
                }
                response.send(Response);
             });
        }
      
  
    });
    
});
app.get('/Adminbardata1',urlencodedparser, function(req,response){

    //var user_id = req.params.id;
    var Response;
    client.query('SELECT COUNT(1) AS invoices, DATE(invoice_date) as date FROM invoice_list GROUP BY DATE(invoice_date)',(err,res)=>{
        if(err)
        {
            Response = {"status": 400, "message":err};
        }
        else{
            Response={"status":200,"message":"Success","result":res.rows};
        }
        response.send(Response);
    });
    
});
app.get('/Adminbardata2',urlencodedparser, function(req,response){

    //var user_id = req.params.id;
    var Response;
    client.query('SELECT COUNT(1) AS invoices,user_details.username FROM invoice_list INNER JOIN user_details ON invoice_list.user_id = user_details.user_id GROUP BY user_details.username',(err,res)=>{
        if(err)
        {
            Response = {"status": 400, "message":err};
        }
        else{
            Response={"status":200,"message":"Success","result":res.rows};
        }
        response.send(Response);
    });
    
});

app.listen(port, function (){
    console.log('Listening on localhost:3030');
});