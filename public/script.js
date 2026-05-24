const socket = io();  
let todasLasCamas = [];  
let camaSeleccionada = null;  
  
window.onload = () => {  
  setTimeout(() => {  
    document.getElementById('loader').style.display = 'none';  
    document.getElementById('app').style.display = 'block';  
  }, 2000);  
  cargarCamas();  
}  
  
socket.on('actualizar_camas', cargarCamas);  
  
async function cargarCamas(){  
  try {  
    todasLasCamas = await (await fetch('/api/camas')).json();  
  } catch(e) { console.error("Error cargando camas", e); }  
}  
  
function abrirModal(vivienda){  
  const modal = document.getElementById('modal');  
  const camasVivienda = todasLasCamas.filter(c => c.vivienda==vivienda);  
  const habs = [...new Set(camasVivienda.map(c => c.habitacion))].sort();  
    
  let html = `<h2>${vivienda}</h2><div class="cuartos-grid">`;  
  habs.forEach(h => {  
    const camasHab = camasVivienda.filter(c => c.habitacion==h);  
    const ocupadas = camasHab.filter(c => c.ocupado).length;  
    const clase = ocupadas==3? 'lleno' : 'disponible';  
    html += `<button class="btn-hab ${clase}" onclick="mostrarCuarto('${vivienda}','${h}')">Hab ${h}<br>${ocupadas}/3</button>`;  
  });  
  html += `</div><br><button onclick="cerrarModal()">Cerrar</button>`;  
    
  document.getElementById('modal-contenido').innerHTML = html;  
  modal.style.display = 'block';  
}  
  
function mostrarCuarto(vivienda, habitacion){  
  const camas = todasLasCamas.filter(c => c.vivienda==vivienda && c.habitacion==habitacion);  
  let html = `<h3>${vivienda} - Habitación ${habitacion}</h3><div class="camas-grid">`;  
  camas.forEach(c => {  
    html += `<div class="cama ${c.ocupado?'ocupada':''}">  
      ${!c.ocupado? `<input type="radio" name="cama" value="${c.id}" onchange="camaSeleccionada=${c.id}">` : ''}  
      <span>Cama ${c.cama_num}</span>  
      ${c.ocupado? `<small>${c.nombre}</small>` : ''}  
    </div>`;  
  });  
  html += `</div><button onclick="mostrarForm()">Reservar Cama</button> <button onclick="abrirModal('${vivienda}')">Volver</button>`;  
  document.getElementById('modal-contenido').innerHTML = html;  
}  
  
function mostrarForm(){  
  if(!camaSeleccionada){ alert('Selecciona una cama primero'); return; }  
  document.getElementById('modal-contenido').innerHTML = `  
    <h3>Datos de Reserva</h3>  
    <input id="nombre" placeholder="NOMBRE COMPLETO" required><br>  
    <input id="area" placeholder="AREA" required><br>  
    <input id="dni" placeholder="DNI" required><br>  
    <input id="dias" type="number" placeholder="CUANTOS DIAS" min="1" required><br>  
    <button onclick="guardar()">GUARDAR</button> <button onclick="cerrarModal()">Cancelar</button>  
  `;  
}  
  
async function guardar(){  
  const body = {  
    id: camaSeleccionada,   
    nombre: document.getElementById('nombre').value.trim(),   
    area: document.getElementById('area').value.trim(),   
    dni: document.getElementById('dni').value.trim(),   
    dias: parseInt(document.getElementById('dias').value)  
  };  
  if(!body.nombre ||!body.area ||!body.dni ||!body.dias){ alert('Completa todos los campos'); return; }  
    
  const res = await fetch('/api/reservar', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});  
  const data = await res.json();  
  if(res.ok){   
    alert('Reserva guardada con éxito');   
    camaSeleccionada = null;  
    cerrarModal();   
  } else {   
    alert('Error: ' + data.error);   
  }  
}  
  
function cerrarModal(e){   
  if(!e || e.target.id=='modal') {  
    document.getElementById('modal').style.display='none';   
    camaSeleccionada = null;  
  }   
}  
