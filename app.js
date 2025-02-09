/* VARIABLES GLOBALES */
var map;
var currentLocationMarker = null;
var organizations = []; // Se llenarán desde Firebase.
var currentOrg = null;

// CONFIGURACIÓN DE FIREBASE  
// Se actualizan los valores con los datos reales de tu proyecto en Firebase.
var firebaseConfig = {
  apiKey: "AIzaSyCm8fUYcc6VON3F5KPknyvqsNgsm0g80gk",
  authDomain: "people-for-people-001.firebaseapp.com",
  databaseURL: "https://people-for-people-001.firebaseio.com",
  projectId: "people-for-people-001",
  storageBucket: "people-for-people-001.firebasestorage.app",
  messagingSenderId: "77800944514",
  appId: "1:77800944514:web:9b4f35f552f88ab5fe959b",
  measurementId: "G-BW63R3XK9E"
};
firebase.initializeApp(firebaseConfig);
var database = firebase.database();

// ÍCONOS DE GOOGLE MAPS
const helpIcon = "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
const volunteerIcon = "http://maps.google.com/mapfiles/ms/icons/purple-dot.png";
const currentLocationIcon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";

// FUNCIÓN DE INICIALIZACIÓN DEL MAPA (llamada mediante el callback de Google Maps)
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 40.416775, lng: -3.703790 },
    zoom: 12
  });

  // Actualización en tiempo real de la ubicación del usuario
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      function (position) {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        if (currentLocationMarker) {
          currentLocationMarker.setPosition(pos);
        } else {
          currentLocationMarker = new google.maps.Marker({
            position: pos,
            map: map,
            title: "Tu ubicación actual",
            icon: currentLocationIcon,
          });
        }
        map.setCenter(pos);
      },
      function (error) {
        console.error("Error obteniendo la ubicación:", error);
      }
    );
  }
}
window.initMap = initMap;

// FUNCIONES PARA EL CHAT (colores aleatorios)
function getRandomColor() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
}
function getUserColor(username) {
  if (!window.userColors) window.userColors = {};
  if (!window.userColors[username]) {
    window.userColors[username] = getRandomColor();
  }
  return window.userColors[username];
}

document.addEventListener("DOMContentLoaded", function () {
  // ELEMENTOS DE LA INTERFAZ
  const registrationForm = document.getElementById("registration-form");
  const registrationScreen = document.getElementById("registration-screen");
  const mainApp = document.getElementById("main-app");
  const menuButtons = document.querySelectorAll(".menu-btn");
  const contentSections = document.querySelectorAll(".content-section");
  const profileBtn = document.getElementById("profile-btn");

  // Actualizar la imagen de perfil (imagen predeterminada en blanco)
  const defaultProfilePhoto = "https://via.placeholder.com/40/FFFFFF/FFFFFF?text=";
  const storedProfilePhoto = localStorage.getItem("profilePhoto");
  if (
    storedProfilePhoto &&
    storedProfilePhoto.trim() !== "" &&
    storedProfilePhoto !== "null" &&
    storedProfilePhoto !== "undefined"
  ) {
    document.querySelector(".profile-img").src = storedProfilePhoto;
  } else {
    document.querySelector(".profile-img").src = defaultProfilePhoto;
  }

  // Registro simulado: si ya existiera un usuario registrado, se muestra la app principal
  if (localStorage.getItem("userRegistered")) {
    registrationScreen.style.display = "none";
    mainApp.style.display = "block";
    updateProfileDisplay();
  } else {
    registrationScreen.style.display = "flex";
    mainApp.style.display = "none";
  }

  registrationForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const usernameInput = document.getElementById("username").value.trim();
    localStorage.setItem("username", usernameInput);
    localStorage.setItem("userRegistered", true);
    registrationScreen.style.display = "none";
    mainApp.style.display = "block";
    updateProfileDisplay();
  });

  // Función para mostrar la sección seleccionada
  function showSection(sectionId) {
    contentSections.forEach(function (section) {
      section.style.display = section.id === sectionId ? "block" : "none";
    });
  }

  // Eventos del menú inferior
  menuButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const target = this.getAttribute("data-target");
      showSection(target);
    });
  });

  // Mostrar perfil al hacer clic en el botón de perfil
  profileBtn.addEventListener("click", function () {
    showSection("perfil");
    updateProfileDisplay();
  });

  // --- CREACIÓN DE PUNTOS (Ayuda y Voluntario) CON FIREBASE ---
  document.getElementById("crear-punto-ayuda").addEventListener("click", function () {
    document.getElementById("punto-ayuda-info").style.display = "block";
    document.getElementById("chat-ayuda").style.display = "block";
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          database.ref("puntos").push({
            tipo: "ayuda",
            lat: pos.lat,
            lng: pos.lng,
            info: "Punto de Ayuda",
            timestamp: Date.now(),
          });
        },
        function (error) {
          const center = map.getCenter();
          database.ref("puntos").push({
            tipo: "ayuda",
            lat: center.lat(),
            lng: center.lng(),
            info: "Punto de Ayuda",
            timestamp: Date.now(),
          });
        }
      );
    } else {
      const center = map.getCenter();
      database.ref("puntos").push({
        tipo: "ayuda",
        lat: center.lat(),
        lng: center.lng(),
        info: "Punto de Ayuda",
        timestamp: Date.now(),
      });
    }
  });

  document.getElementById("crear-punto-voluntario").addEventListener("click", function () {
    document.getElementById("punto-voluntario-info").style.display = "block";
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          database.ref("puntos").push({
            tipo: "voluntario",
            lat: pos.lat,
            lng: pos.lng,
            info: "Punto de Voluntario",
            timestamp: Date.now(),
          });
        },
        function (error) {
          const center = map.getCenter();
          database.ref("puntos").push({
            tipo: "voluntario",
            lat: center.lat(),
            lng: center.lng(),
            info: "Punto de Voluntario",
            timestamp: Date.now(),
          });
        }
      );
    } else {
      const center = map.getCenter();
      database.ref("puntos").push({
        tipo: "voluntario",
        lat: center.lat(),
        lng: center.lng(),
        info: "Punto de Voluntario",
        timestamp: Date.now(),
      });
    }
  });

  // --- CHAT LOCAL PARA "Pedir Ayuda" ---
  document.getElementById("chat-ayuda-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const username = localStorage.getItem("username") || "Tú";
    const input = document.getElementById("chat-ayuda-input");
    const message = input.value.trim();
    if (message !== "") {
      const msgContainer = document.createElement("div");
      const usernameSpan = document.createElement("span");
      usernameSpan.classList.add("chat-username");
      usernameSpan.style.color = getUserColor(username);
      usernameSpan.innerText = username + ": ";
      const messageSpan = document.createElement("span");
      messageSpan.classList.add("chat-text");
      messageSpan.innerText = message;
      msgContainer.appendChild(usernameSpan);
      msgContainer.appendChild(messageSpan);
      document.getElementById("chat-ayuda-messages").appendChild(msgContainer);
      const chatContainer = document.getElementById("chat-ayuda-messages");
      chatContainer.scrollTop = chatContainer.scrollHeight;
      input.value = "";
    }
  });

  // --- PESTAÑAS DE PERFIL ---
  const profileTabButtons = document.querySelectorAll(".profile-tab-btn");
  const profileTabContents = document.querySelectorAll(".profile-tab-content");

  profileTabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const tab = this.getAttribute("data-tab");
      profileTabContents.forEach(function (content) {
        content.style.display = content.id === tab ? "block" : "none";
      });
    });
  });

  document.getElementById("cambiar-foto-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const fileInput = document.getElementById("nuevo-perfil-img");
    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        document.querySelector(".profile-img").src = e.target.result;
        localStorage.setItem("profilePhoto", e.target.result);
      };
      reader.readAsDataURL(fileInput.files[0]);
    }
  });

  document.getElementById("datos-personales-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const fecha = document.getElementById("fecha-nacimiento").value;
    localStorage.setItem("nombre", nombre);
    localStorage.setItem("apellido", apellido);
    localStorage.setItem("fecha", fecha);
    updateProfileDisplay();
  });

  document.getElementById("formacion-profesional-form").addEventListener("submit", function (e) {
    e.preventDefault();
    localStorage.setItem("formacion", "Formación guardada");
    updateProfileDisplay();
  });

  function updateProfileDisplay() {
    document.getElementById("display-username").innerText = "Nombre de Usuario: " + (localStorage.getItem("username") || "");
    document.getElementById("display-nombre").innerText = "Nombre: " + (localStorage.getItem("nombre") || "");
    document.getElementById("display-apellido").innerText = "Apellido: " + (localStorage.getItem("apellido") || "");
    document.getElementById("display-fecha").innerText = "Fecha de Nacimiento: " + (localStorage.getItem("fecha") || "");
    document.getElementById("display-formacion").innerText = "Formación Profesional: " + (localStorage.getItem("formacion") || "");
  }

  // --- ADJUNTAR ARCHIVOS EN FORMACIÓN PROFESIONAL ---
  document.getElementById("adjuntar-formacion").addEventListener("submit", function (e) {
    e.preventDefault();
    const tituloArchivo = document.getElementById("archivo-titulo").value.trim();
    const archivoInput = document.getElementById("archivo-input");
    if (tituloArchivo !== "" && archivoInput.files && archivoInput.files[0]) {
      const file = archivoInput.files[0];
      const li = document.createElement("div");
      li.classList.add("archivo-item");
      if (file.type.startsWith("image")) {
        const reader = new FileReader();
        reader.onload = function (e) {
          li.innerHTML = "";
          const img = document.createElement("img");
          img.src = e.target.result;
          li.appendChild(img);
          const span = document.createElement("span");
          span.innerText = tituloArchivo + " - " + file.name;
          li.appendChild(span);
          const viewButton = document.createElement("button");
          viewButton.innerText = "Visualizar";
          viewButton.classList.add("view-btn");
          viewButton.addEventListener("click", function () {
            openModal(e.target.result);
          });
          li.appendChild(viewButton);
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = function (e) {
          li.innerHTML = "";
          const span = document.createElement("span");
          span.innerText = tituloArchivo + " - " + file.name;
          li.appendChild(span);
          const viewButton = document.createElement("button");
          viewButton.innerText = "Visualizar";
          viewButton.classList.add("view-btn");
          viewButton.addEventListener("click", function () {
            openModal(e.target.result);
          });
          li.appendChild(viewButton);
        };
        reader.readAsDataURL(file);
      }
      document.getElementById("archivos-list").appendChild(li);
      this.reset();
    }
  });

  // --- MÓDULO DE ORGANIZACIONES CON FIREBASE ---
  const orgListView = document.getElementById("org-list-view");
  const orgCreateFormDiv = document.getElementById("org-create-form");
  const orgDetailView = document.getElementById("org-detail-view");
  const orgListContainer = document.getElementById("org-list");

  document.getElementById("mostrar-org-create").addEventListener("click", function () {
    orgListView.style.display = "none";
    orgCreateFormDiv.style.display = "block";
  });

  document.getElementById("cancelar-org").addEventListener("click", function () {
    orgCreateFormDiv.style.display = "none";
    orgListView.style.display = "block";
  });

  document.getElementById("crear-org-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const title = document.getElementById("org-title").value.trim();
    const infoText = document.getElementById("org-info-text").value.trim();
    const imageInput = document.getElementById("org-image");
    let newOrg = {
      title: title,
      info: infoText,
      image: null,
      admin: localStorage.getItem("username") || "Admin",
      members: []
    };

    function pushOrg() {
      database.ref("organizaciones").push(newOrg, function (error) {
        if (error) {
          console.error("Error al crear la organización:", error);
        }
      });
    }
    if (imageInput.files && imageInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        newOrg.image = e.target.result;
        pushOrg();
      };
      reader.readAsDataURL(imageInput.files[0]);
    } else {
      pushOrg();
    }
    this.reset();
    orgCreateFormDiv.style.display = "none";
    orgListView.style.display = "block";
  });

  function updateOrgList() {
    orgListContainer.innerHTML = "";
    organizations.forEach(function (org) {
      const orgDiv = document.createElement("div");
      orgDiv.classList.add("org-item");
      orgDiv.setAttribute("data-id", org.firebaseKey);
      if (org.image) {
        const img = document.createElement("img");
        img.src = org.image;
        orgDiv.appendChild(img);
      }
      const infoDiv = document.createElement("div");
      const titleSpan = document.createElement("span");
      titleSpan.innerText = org.title;
      infoDiv.appendChild(titleSpan);
      const adminSpan = document.createElement("span");
      adminSpan.classList.add("org-admin");
      adminSpan.innerText = "Admin: " + org.admin;
      infoDiv.appendChild(adminSpan);
      orgDiv.appendChild(infoDiv);
      orgListContainer.appendChild(orgDiv);
    });
  }

  orgListContainer.addEventListener("click", function (e) {
    const orgItem = e.target.closest(".org-item");
    if (orgItem) {
      const orgId = orgItem.getAttribute("data-id");
      const org = organizations.find(function (o) {
        return o.firebaseKey === orgId;
      });
      if (org) {
        currentOrg = org;
        mostrarOrgDetalle(org);
      }
    }
  });

  function mostrarOrgDetalle(org) {
    orgListView.style.display = "none";
    orgDetailView.style.display = "block";
    const orgDetailDiv = document.getElementById("org-detail");
    orgDetailDiv.innerHTML = "";
    const titulo = document.createElement("h3");
    titulo.innerText = org.title;
    orgDetailDiv.appendChild(titulo);
    const adminP = document.createElement("p");
    adminP.classList.add("org-admin");
    adminP.innerText = "Admin: " + org.admin;
    orgDetailDiv.appendChild(adminP);
    const infoP = document.createElement("p");
    infoP.innerText = org.info;
    orgDetailDiv.appendChild(infoP);
    if (org.image) {
      const img = document.createElement("img");
      img.src = org.image;
      img.style.maxWidth = "100px";
      img.style.display = "block";
      img.style.marginBottom = "10px";
      orgDetailDiv.appendChild(img);
    }
    actualizarMiembros();

    // Configurar chat de organización en tiempo real
    const orgChatContainer = document.getElementById("org-chat-messages");
    orgChatContainer.innerHTML = "";
    var chatRef = database.ref("org_chat/" + org.firebaseKey);
    chatRef.off();
    chatRef.on("child_added", function (snapshot) {
      const msg = snapshot.val();
      const msgDiv = document.createElement("div");
      const usernameSpan = document.createElement("span");
      usernameSpan.classList.add("chat-username");
      usernameSpan.style.color = getUserColor(msg.user);
      usernameSpan.innerText = msg.user + ": ";
      const messageSpan = document.createElement("span");
      messageSpan.classList.add("chat-text");
      messageSpan.innerText = msg.text;
      msgDiv.appendChild(usernameSpan);
      msgDiv.appendChild(messageSpan);
      orgChatContainer.appendChild(msgDiv);
      orgChatContainer.scrollTop = orgChatContainer.scrollHeight;
    });

    currentOrg = org;
    const unirseBtn = document.getElementById("unirse-org");
    const currentUsername = localStorage.getItem("username") || "Tú";
    if (org.members && org.members.indexOf(currentUsername) !== -1) {
      unirseBtn.disabled = true;
      unirseBtn.innerText = "Ya te has unido";
    } else {
      unirseBtn.disabled = false;
      unirseBtn.innerText = "Unirse a Organización";
    }
  }

  document.getElementById("volver-org-list").addEventListener("click", function () {
    orgDetailView.style.display = "none";
    orgListView.style.display = "block";
  });

  document.getElementById("unirse-org").addEventListener("click", function () {
    if (currentOrg) {
      const username = localStorage.getItem("username") || "Tú";
      let updatedMembers = currentOrg.members ? currentOrg.members.slice() : [];
      if (updatedMembers.indexOf(username) === -1) {
        updatedMembers.push(username);
        database.ref("organizaciones/" + currentOrg.firebaseKey).update({
          members: updatedMembers
        });
      }
    }
  });

  function actualizarMiembros() {
    const miembrosDiv = document.getElementById("org-members-list");
    miembrosDiv.innerHTML = "";
    if (currentOrg && currentOrg.members && currentOrg.members.length > 0) {
      currentOrg.members.forEach(function (member) {
        const memDiv = document.createElement("div");
        memDiv.innerText = member;
        miembrosDiv.appendChild(memDiv);
      });
    } else {
      miembrosDiv.innerText = "No hay miembros aún.";
    }
  }

  document.getElementById("org-chat-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const username = localStorage.getItem("username") || "Tú";
    const input = document.getElementById("org-chat-input");
    const message = input.value.trim();
    if (message !== "" && currentOrg) {
      var chatRef = database.ref("org_chat/" + currentOrg.firebaseKey);
      chatRef.push({ user: username, text: message, timestamp: Date.now() });
      input.value = "";
    }
  });

  // LISTENERS DE FIREBASE EN TIEMPO REAL
  database.ref("puntos").on("child_added", function (snapshot) {
    const punto = snapshot.val();
    if (punto.tipo === "ayuda" || punto.tipo === "voluntario") {
      var markerIcon = punto.tipo === "ayuda" ? helpIcon : volunteerIcon;
      new google.maps.Marker({
        position: { lat: punto.lat, lng: punto.lng },
        map: map,
        title: punto.info,
        icon: markerIcon
      });
    }
  });

  database.ref("organizaciones").on("child_added", function (snapshot) {
    var org = snapshot.val();
    org.firebaseKey = snapshot.key;
    organizations.push(org);
    updateOrgList();
  });

  database.ref("organizaciones").on("child_changed", function (snapshot) {
    var updatedOrg = snapshot.val();
    updatedOrg.firebaseKey = snapshot.key;
    for (let i = 0; i < organizations.length; i++) {
      if (organizations[i].firebaseKey === updatedOrg.firebaseKey) {
        organizations[i] = updatedOrg;
        break;
      }
    }
    if (currentOrg && currentOrg.firebaseKey === updatedOrg.firebaseKey) {
      currentOrg = updatedOrg;
      actualizarMiembros();
      const unirseBtn = document.getElementById("unirse-org");
      const currentUsername = localStorage.getItem("username") || "Tú";
      if (currentOrg.members && currentOrg.members.indexOf(currentUsername) !== -1) {
        unirseBtn.disabled = true;
        unirseBtn.innerText = "Ya te has unido";
      }
    }
    updateOrgList();
  });

  // --- MODAL PARA VISUALIZAR ARCHIVOS ---
  function openModal(url) {
    const modal = document.getElementById("modal-viewer");
    const iframe = document.getElementById("modal-iframe");
    iframe.src = url;
    modal.style.display = "block";
  }
  document.getElementById("close-modal").addEventListener("click", function () {
    document.getElementById("modal-viewer").style.display = "none";
    document.getElementById("modal-iframe").src = "";
  });
});
