// Archivo: app.js

// Variables globales
var map;
var currentLocationMarker = null;
var organizations = []; // Cada organización: { id, title, info, image (dataURL), admin, members: [], chatMessages: [] }
var currentOrg = null;

// Diccionario para almacenar colores asignados a cada usuario del chat
var userColors = {};

// Función para generar un color aleatorio en formato hexadecimal
function getRandomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

// Función para obtener el color asignado a un usuario; si no existe, se asigna uno nuevo.
function getUserColor(username) {
  if (!userColors[username]) {
    userColors[username] = getRandomColor();
  }
  return userColors[username];
}

// Íconos de Google Maps originales
const helpIcon = "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
const volunteerIcon = "http://maps.google.com/mapfiles/ms/icons/purple-dot.png";
const currentLocationIcon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";

// Función llamada por el callback de Google Maps API
function initMap() {
  // Inicializa el mapa con un centro por defecto
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 40.416775, lng: -3.703790 },
    zoom: 12
  });

  // Usar watchPosition para mantener el marcador de ubicación activo y actualizado
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      position => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        if (currentLocationMarker) {
          currentLocationMarker.setPosition(pos);
        } else {
          currentLocationMarker = new google.maps.Marker({
            position: pos,
            map: map,
            title: "Tu ubicación actual",
            icon: currentLocationIcon
          });
        }
        map.setCenter(pos);
      },
      error => {
        console.log("Error obteniendo la ubicación actual:", error);
      }
    );
  }
}
window.initMap = initMap;

document.addEventListener('DOMContentLoaded', function () {
  // Elementos de la interfaz
  const registrationForm = document.getElementById('registration-form');
  const registrationScreen = document.getElementById('registration-screen');
  const mainApp = document.getElementById('main-app');
  const menuButtons = document.querySelectorAll('.menu-btn');
  const contentSections = document.querySelectorAll('.content-section');
  const profileBtn = document.getElementById('profile-btn');

  // Si existe foto de perfil en localStorage, actualizar la imagen
  const storedProfilePhoto = localStorage.getItem('profilePhoto');
  if (storedProfilePhoto) {
    document.querySelector('.profile-img').src = storedProfilePhoto;
  }

  // Comprobar registro (simulado con localStorage)
  if (localStorage.getItem('userRegistered')) {
    registrationScreen.style.display = 'none';
    mainApp.style.display = 'block';
    updateProfileDisplay();
  } else {
    registrationScreen.style.display = 'flex';
    mainApp.style.display = 'none';
  }

  registrationForm.addEventListener('submit', function (e) {
    e.preventDefault();
    // Guardar nombre de usuario
    const usernameInput = document.getElementById('username').value.trim();
    localStorage.setItem('username', usernameInput);
    localStorage.setItem('userRegistered', true);
    registrationScreen.style.display = 'none';
    mainApp.style.display = 'block';
    updateProfileDisplay();
  });

  // Función para mostrar la sección seleccionada
  function showSection(sectionId) {
    contentSections.forEach(section => {
      section.style.display = (section.id === sectionId) ? 'block' : 'none';
    });
  }

  // Eventos del menú inferior
  menuButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const target = this.getAttribute('data-target');
      showSection(target);
    });
  });

  // Mostrar perfil al hacer clic
  profileBtn.addEventListener('click', function () {
    showSection('perfil');
    updateProfileDisplay();
  });

  // --- CREACIÓN DE PUNTOS EN EL MAPA ---

  // Punto de Ayuda: usar ícono original
  document.getElementById('crear-punto-ayuda').addEventListener('click', function () {
    document.getElementById('punto-ayuda-info').style.display = 'block';
    document.getElementById('chat-ayuda').style.display = 'block';

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          new google.maps.Marker({
            position: pos,
            map: map,
            title: "Punto de Ayuda",
            icon: helpIcon
          });
        },
        error => {
          console.error("Error obteniendo la posición para el punto de ayuda:", error);
          new google.maps.Marker({
            position: map.getCenter(),
            map: map,
            title: "Punto de Ayuda",
            icon: helpIcon
          });
        }
      );
    } else {
      new google.maps.Marker({
        position: map.getCenter(),
        map: map,
        title: "Punto de Ayuda",
        icon: helpIcon
      });
    }
  });

  // Punto de Voluntario: usar ícono original
  document.getElementById('crear-punto-voluntario').addEventListener('click', function () {
    document.getElementById('punto-voluntario-info').style.display = 'block';

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          new google.maps.Marker({
            position: pos,
            map: map,
            title: "Punto de Voluntariado",
            icon: volunteerIcon
          });
        },
        error => {
          console.error("Error obteniendo la posición para el punto de voluntariado:", error);
          new google.maps.Marker({
            position: map.getCenter(),
            map: map,
            title: "Punto de Voluntariado",
            icon: volunteerIcon
          });
        }
      );
    } else {
      new google.maps.Marker({
        position: map.getCenter(),
        map: map,
        title: "Punto de Voluntariado",
        icon: volunteerIcon
      });
    }
  });

  // --- INTERFAZ DE CHATS ---

  // Chat en "Pedir Ayuda"
  document.getElementById('chat-ayuda-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = localStorage.getItem('username') || "Tú";
    const input = document.getElementById('chat-ayuda-input');
    const message = input.value.trim();
    if (message !== "") {
      const msgContainer = document.createElement('div');
      const usernameSpan = document.createElement('span');
      usernameSpan.classList.add('chat-username');
      usernameSpan.style.color = getUserColor(username);
      usernameSpan.innerText = username + ": ";
      const messageSpan = document.createElement('span');
      messageSpan.classList.add('chat-text');
      messageSpan.innerText = message;
      msgContainer.appendChild(usernameSpan);
      msgContainer.appendChild(messageSpan);
      document.getElementById('chat-ayuda-messages').appendChild(msgContainer);
      // Auto scroll del chat
      let chatContainer = document.getElementById('chat-ayuda-messages');
      chatContainer.scrollTop = chatContainer.scrollHeight;
      input.value = "";
    }
  });

  // Chat en "Organización"
  document.getElementById('org-chat-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = localStorage.getItem('username') || "Tú";
    const input = document.getElementById('org-chat-input');
    const message = input.value.trim();
    if (message !== "" && currentOrg) {
      currentOrg.chatMessages.push({ user: username, text: message });
      actualizarChatOrg();
      let orgChatContainer = document.getElementById('org-chat-messages');
      orgChatContainer.scrollTop = orgChatContainer.scrollHeight;
      input.value = "";
    }
  });

  // --- PESTAÑAS DE PERFIL ---

  const profileTabButtons = document.querySelectorAll('.profile-tab-btn');
  const profileTabContents = document.querySelectorAll('.profile-tab-content');

  profileTabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const tab = this.getAttribute('data-tab');
      profileTabContents.forEach(function (content) {
        content.style.display = (content.id === tab) ? 'block' : 'none';
      });
    });
  });

  // Actualizar foto de perfil y guardarla en localStorage
  document.getElementById('cambiar-foto-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const fileInput = document.getElementById('nuevo-perfil-img');
    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        document.querySelector('.profile-img').src = e.target.result;
        localStorage.setItem('profilePhoto', e.target.result);
      };
      reader.readAsDataURL(fileInput.files[0]);
    }
  });

  // Actualizar datos personales y mostrarlos en el perfil
  document.getElementById('datos-personales-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const fecha = document.getElementById('fecha-nacimiento').value;
    localStorage.setItem('nombre', nombre);
    localStorage.setItem('apellido', apellido);
    localStorage.setItem('fecha', fecha);
    updateProfileDisplay();
  });

  // Actualizar formación profesional (simulación)
  document.getElementById('formacion-profesional-form').addEventListener('submit', function (e) {
    e.preventDefault();
    localStorage.setItem('formacion', "Formación guardada");
    updateProfileDisplay();
  });

  // Función para actualizar la visualización del perfil
  function updateProfileDisplay() {
    document.getElementById('display-username').innerText = "Nombre de Usuario: " + (localStorage.getItem('username') || "");
    document.getElementById('display-nombre').innerText = "Nombre: " + (localStorage.getItem('nombre') || "");
    document.getElementById('display-apellido').innerText = "Apellido: " + (localStorage.getItem('apellido') || "");
    document.getElementById('display-fecha').innerText = "Fecha de Nacimiento: " + (localStorage.getItem('fecha') || "");
    document.getElementById('display-formacion').innerText = "Formación Profesional: " + (localStorage.getItem('formacion') || "");
  }

  // --- ADJUNTAR ARCHIVOS EN FORMACIÓN PROFESIONAL ---
  document.getElementById('adjuntar-formacion').addEventListener('submit', function (e) {
    e.preventDefault();
    const tituloArchivo = document.getElementById('archivo-titulo').value.trim();
    const archivoInput = document.getElementById('archivo-input');
    if (tituloArchivo !== "" && archivoInput.files && archivoInput.files[0]) {
      const file = archivoInput.files[0];
      const li = document.createElement('div');
      li.classList.add('archivo-item');
      if (file.type.startsWith('image')) {
        const reader = new FileReader();
        reader.onload = function (e) {
          li.innerHTML = "";
          const img = document.createElement('img');
          img.src = e.target.result;
          li.appendChild(img);
          const span = document.createElement('span');
          span.innerText = tituloArchivo + " - " + file.name;
          li.appendChild(span);
          const viewButton = document.createElement('button');
          viewButton.innerText = "Visualizar";
          viewButton.classList.add('view-btn');
          viewButton.addEventListener('click', function () {
            openModal(e.target.result);
          });
          li.appendChild(viewButton);
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = function (e) {
          li.innerHTML = "";
          const span = document.createElement('span');
          span.innerText = tituloArchivo + " - " + file.name;
          li.appendChild(span);
          const viewButton = document.createElement('button');
          viewButton.innerText = "Visualizar";
          viewButton.classList.add('view-btn');
          viewButton.addEventListener('click', function () {
            openModal(e.target.result);
          });
          li.appendChild(viewButton);
        };
        reader.readAsDataURL(file);
      }
      document.getElementById('archivos-list').appendChild(li);
      this.reset();
    }
  });

  // --- MÓDULO DE ORGANIZACIONES ---

  const orgListView = document.getElementById('org-list-view');
  const orgCreateFormDiv = document.getElementById('org-create-form');
  const orgDetailView = document.getElementById('org-detail-view');
  const orgListContainer = document.getElementById('org-list');

  // Mostrar formulario para crear organización
  document.getElementById('mostrar-org-create').addEventListener('click', function () {
    orgListView.style.display = 'none';
    orgCreateFormDiv.style.display = 'block';
  });

  // Cancelar creación de organización
  document.getElementById('cancelar-org').addEventListener('click', function () {
    orgCreateFormDiv.style.display = 'none';
    orgListView.style.display = 'block';
  });

  // Crear organización (se agrega el admin)
  document.getElementById('crear-org-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const title = document.getElementById('org-title').value.trim();
    const infoText = document.getElementById('org-info-text').value.trim();
    const imageInput = document.getElementById('org-image');
    const orgId = new Date().getTime();
    let newOrg = { 
      id: orgId, 
      title: title, 
      info: infoText, 
      image: null, 
      admin: localStorage.getItem('username') || "Admin", 
      members: [], 
      chatMessages: [] 
    };

    function agregarOrg() {
      organizations.push(newOrg);
      updateOrgList();
    }

    if (imageInput.files && imageInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        newOrg.image = e.target.result;
        agregarOrg();
      };
      reader.readAsDataURL(imageInput.files[0]);
    } else {
      agregarOrg();
    }
    this.reset();
    orgCreateFormDiv.style.display = 'none';
    orgListView.style.display = 'block';
  });

  // Función para actualizar el listado de organizaciones (incluye info del Admin)
  function updateOrgList() {
    orgListContainer.innerHTML = "";
    organizations.forEach(org => {
      const orgDiv = document.createElement('div');
      orgDiv.classList.add('org-item');
      orgDiv.setAttribute('data-id', org.id);
      if (org.image) {
        const img = document.createElement('img');
        img.src = org.image;
        orgDiv.appendChild(img);
      }
      const infoDiv = document.createElement('div');
      const titleSpan = document.createElement('span');
      titleSpan.innerText = org.title;
      infoDiv.appendChild(titleSpan);
      const adminSpan = document.createElement('span');
      adminSpan.classList.add('org-admin');
      // Muestra el nombre de usuario del admin y se alinea a la derecha
      adminSpan.innerText = "Admin: " + org.admin;
      infoDiv.appendChild(adminSpan);
      orgDiv.appendChild(infoDiv);
      orgListContainer.appendChild(orgDiv);
    });
  }

  // Manejar clic en un elemento de organización (delegación)
  orgListContainer.addEventListener('click', function (e) {
    const orgItem = e.target.closest('.org-item');
    if (orgItem) {
      const orgId = orgItem.getAttribute('data-id');
      const org = organizations.find(o => o.id == orgId);
      if (org) {
        currentOrg = org;
        mostrarOrgDetalle(org);
      }
    }
  });

  function mostrarOrgDetalle(org) {
    orgListView.style.display = 'none';
    orgDetailView.style.display = 'block';
    const orgDetailDiv = document.getElementById('org-detail');
    orgDetailDiv.innerHTML = "";
    const titulo = document.createElement('h3');
    titulo.innerText = org.title;
    orgDetailDiv.appendChild(titulo);
    // Se crea un párrafo para el admin y se le asigna la clase org-admin para alinearse a la derecha.
    const adminP = document.createElement('p');
    adminP.classList.add('org-admin');
    adminP.innerText = "Admin: " + org.admin;
    orgDetailDiv.appendChild(adminP);
    const infoP = document.createElement('p');
    infoP.innerText = org.info;
    orgDetailDiv.appendChild(infoP);
    if (org.image) {
      const img = document.createElement('img');
      img.src = org.image;
      img.style.maxWidth = "100px";
      img.style.display = "block";
      img.style.marginBottom = "10px";
      orgDetailDiv.appendChild(img);
    }
    actualizarMiembros();
    actualizarChatOrg();
    const unirseBtn = document.getElementById('unirse-org');
    if (org.members.includes("Tú")) {
      unirseBtn.disabled = true;
      unirseBtn.innerText = "Ya te has unido";
    } else {
      unirseBtn.disabled = false;
      unirseBtn.innerText = "Unirse a Organización";
    }
  }

  // Volver a la lista de organizaciones
  document.getElementById('volver-org-list').addEventListener('click', function () {
    orgDetailView.style.display = 'none';
    orgListView.style.display = 'block';
  });

  // Unirse a la organización
  document.getElementById('unirse-org').addEventListener('click', function () {
    if (currentOrg && !currentOrg.members.includes("Tú")) {
      currentOrg.members.push("Tú");
      actualizarMiembros();
      this.disabled = true;
      this.innerText = "Ya te has unido";
    }
  });

  // Actualizar listado de miembros de la organización actual
  function actualizarMiembros() {
    const miembrosDiv = document.getElementById('org-members-list');
    miembrosDiv.innerHTML = "";
    if (currentOrg && currentOrg.members.length > 0) {
      currentOrg.members.forEach(member => {
        const memDiv = document.createElement('div');
        memDiv.innerText = member;
        miembrosDiv.appendChild(memDiv);
      });
    } else {
      miembrosDiv.innerText = "No hay miembros aún.";
    }
  }

  // Actualizar vista del chat de organización
  function actualizarChatOrg() {
    const chatContainer = document.getElementById('org-chat-messages');
    chatContainer.innerHTML = "";
    if (currentOrg && currentOrg.chatMessages.length > 0) {
      currentOrg.chatMessages.forEach(msg => {
        const msgDiv = document.createElement('div');
        const usernameSpan = document.createElement('span');
        usernameSpan.classList.add('chat-username');
        usernameSpan.style.color = getUserColor(msg.user);
        usernameSpan.innerText = msg.user + ": ";
        const messageSpan = document.createElement('span');
        messageSpan.classList.add('chat-text');
        messageSpan.innerText = msg.text;
        msgDiv.appendChild(usernameSpan);
        msgDiv.appendChild(messageSpan);
        chatContainer.appendChild(msgDiv);
      });
      // Auto-scroll del chat de organización
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  // Función para abrir el modal y visualizar archivos en pantalla completa
  function openModal(url) {
    const modal = document.getElementById('modal-viewer');
    const iframe = document.getElementById('modal-iframe');
    iframe.src = url;
    modal.style.display = "block";
  }

  // Cerrar el modal
  document.getElementById('close-modal').addEventListener('click', function () {
    document.getElementById('modal-viewer').style.display = 'none';
    document.getElementById('modal-iframe').src = "";
  });
});