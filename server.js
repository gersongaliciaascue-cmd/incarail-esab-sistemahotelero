require('dotenv').config();  
const express = require('express');  
const http = require('http');  
const { Server } = require("socket.io");  
const sqlite3 = require('sqlite3').verbose();  
const nodemailer = require('nodemailer');  
  
const app = express();  
const server = http.createServer(app);  
const io = new Server(server);  
const PORT = process.env.PORT || 3000;  
  
app.use(express.json());  
app.use(express.static('public'));  
  
const db = new sqlite3.Database('./hotel.db');  
  
db.serialize(() => {  
  db.run(`CREATE TABLE IF NOT EXISTS camas (  
    id INTEGER PRIMARY KEY AUTOINCREMENT,  
    vivienda TEXT, habitacion TEXT, cama_num INTEGER,  
    ocupado INTEGER DEFAULT 0, nombre TEXT, area TEXT, dni TEXT, dias INTEGER  
  )`);  
    
  db.get("SELECT COUNT(*) as c FROM camas", (err, row) => {  
    if(row.c == 0){  
      const stmt = db.prepare("INSERT INTO camas (vivienda, habitacion, cama_num) VALUES (?,?,?)");  
      ["5","10","11","19","21","22","23"].forEach(h => { for(let c=1;c<=3;c++) stmt.run("CALICANTO", h, c) });  
      ["34","35","38","39"].forEach(h => { for(let c=1;c<=3;c++) stmt.run("ANDENES", h, c) });  
      stmt.finalize();  
      console.log("Base de datos inicializada con 33 camas");  
    }  
  });  
});  
  
app.get('/api/camas', (req,res) => {  
  db.all("SELECT * FROM camas", [], (err, rows) => {  
    if(err) return res.status(500).json({error: err.message});  
    res.json(rows);  
  });  
});  
  
app.post('/api/reservar', (req,res) => {  
  const {id, nombre, area, dni, dias} = req.body;  
  db.run("UPDATE camas SET ocupado=1, nombre=?, area=?, dni=?, dias=? WHERE id=? AND ocupado=0",  
    [nombre, area, dni, dias, id], function(err){  
      if(err) return res.status(500).json({error: err.message});  
      if(this.changes === 0) return res.status(409).json({error: "Cama ya ocupada"});  
        
      io.emit('actualizar_camas');  
      enviarCorreo(nombre, area, dni, dias, id);  
      res.json({ok: true});  
  });  
});  
  
function enviarCorreo(nombre, area, dni, dias, camaId){  
  if(!process.env.EMAIL_USER ||!process.env.EMAIL_PASS) return console.log("Correo no configurado");  
    
  const transporter = nodemailer.createTransport({  
    service: 'gmail',  
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }  
  });  
  db.get("SELECT vivienda, habitacion, cama_num FROM camas WHERE id=?", [camaId], (err, row) => {  
    const mailOptions = {  
      from: process.env.EMAIL_USER,  
      to: process.env.ADMIN_EMAILS,  
      subject: 'Nueva Reserva ESAB - Inca Rail',  
      text: `Nueva reserva:\nNombre: ${nombre}\nArea: ${area}\nDNI: ${dni}\nDias: ${dias}\nUbicacion: ${row.vivienda} Hab ${row.habitacion} Cama ${row.cama_num}`  
    };  
    transporter.sendMail(mailOptions, (e,info) => {  
      if(e) console.log("Error correo:", e); else console.log("Correo enviado:", info.response);  
    });  
  });  
}  
  
io.on('connection', (socket) => console.log('Usuario conectado'));  
server.listen(PORT, '0.0.0.0', () => console.log(`Servidor en http://localhost:${PORT}`));  
