/* VARIABLES GLOBALES */
var map;
var currentLocationMarker = null;
var organizations = [];
var currentOrg = null; // Se actualizará cuando el usuario seleccione o cree una organización
var currentAyuda = null;
var currentVoluntario = null;

/* Arrays para marcadores de ayuda y voluntarios */
var helpMarkers = [];
var volunteerMarkers = [];

/* VARIABLES PARA ARCHIVOS DE PERFIL */
var profileAttachments = [];
if (localStorage.getItem("profileAttachments")) {
  try {
    profileAttachments = JSON.parse(localStorage.getItem("profileAttachments"));
  } catch (error) {
    console.error("Error parseando profileAttachments:", error);
    profileAttachments = [];
  }
}
function updateAttachmentList() {
  console.log("Actualizando la lista de adjuntos");
  const attachmentListContainer = document.getElementById("profile-attachment-list");
  if (!attachmentListContainer) return;
  let attachments = [];
  try {
    attachments = JSON.parse(localStorage.getItem("profileAttachments")) || [];
  } catch (error) {
    console.error("Error parseando profileAttachments:", error);
  }
  attachmentListContainer.innerHTML = "";
  attachments.forEach(attachment => {
    const div = document.createElement("div");
    div.classList.add("attachment-item");
    div.innerText = attachment.title;
    attachmentListContainer.appendChild(div);
  });
}

/* CONFIGURACIÓN DE FIREBASE */
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
var db = firebase.firestore();

/* ÍCONOS DE GOOGLE MAPS */
const helpIcon = "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
const volunteerIcon = "http://maps.google.com/mapfiles/ms/icons/purple-dot.png";
const currentLocationIcon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";

/* VARIABLE GLOBAL PARA EL MODO ACTUAL */
var currentMode = localStorage.getItem("userMode") || "voluntario";

/* INICIALIZACIÓN DEL MAPA */
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 40.416775, lng: -3.70379 },
    zoom: 12
  });
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      function (position) {
        var pos = {
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
      function (error) {
        console.error("Error obteniendo la ubicación:", error);
      }
    );
  }
}
window.initMap = initMap;

/* VARIABLE GLOBAL PARA EL USUARIO ACTIVO */
var activeUser = localStorage.getItem("username") || "Tú";

/* Función para renderizar mensajes de chat */
function renderChatMessage(msg, container) {
  const currentUser = activeUser;
  const messageContainer = document.createElement("div");
  messageContainer.classList.add("chat-message");
  messageContainer.classList.add(msg.user === currentUser ? "mine" : "other");

  const bubble = document.createElement("div");
  bubble.classList.add("chat-bubble");
  bubble.classList.add(msg.user === currentUser ? "mine" : "other");

  if (msg.user !== currentUser) {
    const usernameElement = document.createElement("div");
    usernameElement.classList.add("chat-username");
    usernameElement.innerText = msg.user;
    bubble.appendChild(usernameElement);
  }

  const messageTextElement = document.createElement("div");
  messageTextElement.classList.add("chat-text");
  messageTextElement.innerText = msg.text;
  bubble.appendChild(messageTextElement);

  messageContainer.appendChild(bubble);
  container.appendChild(messageContainer);
  container.scrollTop = container.scrollHeight;
}

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

/* Funciones para marcadores de Ayuda y Voluntarios */
function addHelpMarker(ayuda) {
  if (ayuda.latitude && ayuda.longitude) {
    var marker = new google.maps.Marker({
      position: { lat: ayuda.latitude, lng: ayuda.longitude },
      map: map,
      title: "Punto de Ayuda: " + ayuda.titulo,
      icon: helpIcon
    });
    helpMarkers.push({ key: ayuda.firebaseKey, marker: marker });
  }
}

function removeHelpMarker(key) {
  helpMarkers = helpMarkers.filter(function(item) {
    if (item.key === key) {
      item.marker.setMap(null);
      return false;
    }
    return true;
  });
}

function addVolunteerMarker(vol) {
  if (vol.latitude && vol.longitude) {
    var marker = new google.maps.Marker({
      position: { lat: vol.latitude, lng: vol.longitude },
      map: map,
      title: "Voluntario: " + vol.user,
      icon: volunteerIcon
    });
    volunteerMarkers.push({ key: vol.firebaseKey, marker: marker });
  }
}

function removeVolunteerMarker(key) {
  volunteerMarkers = volunteerMarkers.filter(function(item) {
    if (item.key === key) {
      item.marker.setMap(null);
      return false;
    }
    return true;
  });
}

/* FULLSCREEN DEL MAPA */
document.addEventListener("fullscreenchange", function () {
  const mapContainer = document.getElementById("map-container");
  if (document.fullscreenElement) {
    mapContainer.classList.add("fullscreen");
  } else {
    mapContainer.classList.remove("fullscreen");
  }
});

/* Variables locales para voluntarios y puntos de ayuda */
let ayudaItems = [];
let voluntarioItems = [];

/* CHAT DE ADMINISTRADORES (Modo Organizador) */
function initAdminChat(org) {
  console.log("Inicializando chat de administrador para org:", org.title);
  const adminChatContainer = document.getElementById("org-admin-chat-messages");
  const adminChatForm = document.getElementById("org-admin-chat-form");
  const adminChatInput = document.getElementById("org-admin-chat-input");

  if (activeUser !== org.admin) {
    adminChatForm.style.display = "none";
    return;
  }

  adminChatForm.onsubmit = function (e) {
    e.preventDefault();
    const message = adminChatInput.value.trim();
    if (message !== "") {
      db.collection("organizaciones")
        .doc(org.firebaseKey)
        .collection("admin_chat")
        .add({
          user: activeUser,
          text: message,
          timestamp: Date.now()
        })
        .catch(error => console.error("Error en admin chat:", error));
      adminChatInput.value = "";
    }
  };

  db.collection("organizaciones")
    .doc(org.firebaseKey)
    .collection("admin_chat")
    .orderBy("timestamp")
    .onSnapshot(function(snapshot) {
      snapshot.docChanges().forEach(function(change) {
        if (change.type === "added") {
          const msg = change.doc.data();
          renderChatMessage(msg, adminChatContainer);
        }
      });
    });
}

/* CHAT DE LA ORGANIZACIÓN (Modo Organizador) */
function initOrgChat(org) {
  console.log("Inicializando chat de organización para org:", org.title);
  const orgChatContainer = document.getElementById("org-chat-messages");
  const orgChatForm = document.getElementById("org-chat-form");
  const orgChatInput = document.getElementById("org-chat-input");

  orgChatForm.onsubmit = function (e) {
    e.preventDefault();
    const message = orgChatInput.value.trim();
    if (message !== "" && currentOrg) {
      db.collection("organizaciones")
        .doc(org.firebaseKey)
        .collection("org_chat")
        .add({
          user: activeUser,
          text: message,
          timestamp: Date.now()
        })
        .catch(error => console.error("Error en org chat:", error));
      orgChatInput.value = "";
    }
  };

  db.collection("organizaciones")
    .doc(org.firebaseKey)
    .collection("org_chat")
    .orderBy("timestamp")
    .onSnapshot(function(snapshot) {
      snapshot.docChanges().forEach(function(change) {
        if (change.type === "added") {
          const msg = change.doc.data();
          renderChatMessage(msg, orgChatContainer);
        }
      });
    });
}

/* FUNCIONES PARA EL MODO ORGANIZADOR */

/* CARGAR LAS ORGANIZACIONES (en el modal de selección/creación) */
function loadAdminOrganizations() {
  const orgListContainer = document.getElementById("orgmode-list");
  if (!orgListContainer) return;
  orgListContainer.innerHTML = "";
  db.collection("organizaciones")
    .where("admin", "==", activeUser)
    .orderBy("timestamp")
    .onSnapshot(function(snapshot) {
      orgListContainer.innerHTML = "";
      snapshot.forEach(function(doc) {
        let org = doc.data();
        org.firebaseKey = doc.id;
        const orgDiv = document.createElement("div");
        orgDiv.classList.add("org-item");
        orgDiv.textContent = org.title;
        orgDiv.addEventListener("click", function () {
          document.getElementById("org-mode-menu").style.display = "none";
          currentOrg = org;
          updateOrgInfoDisplay();
        });
        orgListContainer.appendChild(orgDiv);
      });
    });
}

/* NUEVA FUNCIÓN PARA CARGAR "MIS ORGANIZACIONES"
   Se crea un recuadro con un encabezado, un botón para CREAR ORGANIZACIÓN y la lista de organizaciones
   donde el usuario es administrador.
*/
function loadOrganizadorList() {
  const container = document.getElementById("org-list-organizador");
  if (!container) {
    console.error("No se encontró el contenedor 'org-list-organizador'.");
    return;
  }
  container.innerHTML = "";
  
  // Agregar encabezado del recuadro
  const header = document.createElement("h3");
  header.innerText = "Mis Organizaciones";
  container.appendChild(header);
  
  // Crear botón "Crear Organización"
  const createBtn = document.createElement("button");
  createBtn.innerText = "Crear Organización";
  createBtn.classList.add("action-btn");
  createBtn.addEventListener("click", function() {
    document.getElementById("create-org-form-orgmode-container").style.display = "block";
  });
  container.appendChild(createBtn);

  db.collection("organizaciones")
    .where("admin", "==", activeUser)
    .orderBy("timestamp")
    .onSnapshot(function(snapshot) {
      // Reinicializar contenedor reinsertando el encabezado y botón
      container.innerHTML = "";
      container.appendChild(header);
      container.appendChild(createBtn);
      let empty = true;
      snapshot.forEach(function(doc) {
        let org = doc.data();
        org.firebaseKey = doc.id;
        empty = false;
        const orgDiv = document.createElement("div");
        orgDiv.classList.add("org-item");
        orgDiv.textContent = org.title;
        orgDiv.addEventListener("click", function () {
          currentOrg = org;
          mostrarOrgDetalle(org);
        });
        container.appendChild(orgDiv);
      });
      if (empty) {
        const noMsg = document.createElement("p");
        noMsg.innerText = "No tienes organizaciones.";
        container.appendChild(noMsg);
      }
    });
}

/* Actualizar la información de la organización (vista) */
function updateOrgInfoDisplay() {
  if (!currentOrg) return;
  document.getElementById("org-info-titulo").innerText = "Título: " + currentOrg.title;
  document.getElementById("org-info-creador").innerText = "Creador: " + currentOrg.admin;
  document.getElementById("org-info-detalle").innerText = "Información: " + currentOrg.info;
  document.getElementById("org-info-lugar").innerText = "Lugar: " + (currentOrg.lugar || "No definido");
  document.getElementById("org-info-fecha").innerText =
    "Fecha de Creación: " + (currentOrg.timestamp ? new Date(currentOrg.timestamp).toLocaleDateString() : "No definida");
}

/* FUNCIÓN PARA ABRIR EL PANEL DE EDICIÓN.
   Se ha quitado el botón que estaba dentro del recuadro de People For People; ahora la edición se hace vía recuadro edit (ya implementado en el HTML).
*/
function enableOrgInfoEditing() {
  document.getElementById("org-info-display").style.display = "none";
  document.getElementById("org-info-edit").style.display = "block";
}

/* FUNCIÓN PARA CANCELAR LA EDICIÓN DE INFORMACIÓN */
function cancelOrgInfoEditing() {
  document.getElementById("org-info-edit").style.display = "none";
  document.getElementById("org-info-display").style.display = "block";
}

/* FUNCIÓN PARA SUBIR ARCHIVOS (dentro de la sección de información) */
function uploadOrgFile(e) {
  e.preventDefault();
  var title = document.getElementById("org-file-title").value.trim();
  var fileInput = document.getElementById("org-file-upload");
  if (fileInput.files.length === 0) {
    alert("Por favor, selecciona un archivo.");
    return;
  }
  var file = fileInput.files[0];
  var reader = new FileReader();
  reader.onload = function(ev) {
    var newAttachment = {
      title: title,
      fileName: file.name,
      fileUrl: ev.target.result,
      visibility: "public",
      timestamp: Date.now()
    };
    db.collection("public_files").add(newAttachment)
      .then(function() {
          alert("Archivo subido exitosamente.");
          document.getElementById("org-file-upload-form").reset();
      })
      .catch(function(error) {
          console.error("Error al subir el archivo:", error);
      });
  };
  reader.readAsDataURL(file);
}

/* FUNCIÓN PARA CREAR EL BOTÓN DE PERFIL EN MODO ORGANIZADOR */
function createOrgProfileButton() {
  const orgHeader = document.querySelector(".org-header");
  if (!orgHeader) return;
  if (!document.getElementById("org-profile-btn")) {
    let divProfile = document.createElement("div");
    divProfile.className = "profile-container";
    divProfile.id = "org-profile-btn";
    let img = document.createElement("img");
    img.src = localStorage.getItem("profilePhoto") || "https://via.placeholder.com/40/FFFFFF/FFFFFF?text=";
    img.alt = "Perfil";
    img.className = "profile-img";
    img.onerror = function() {
      this.src = "https://github.com/CharliePoten/People-For-People/blob/main/icono%20perfil.png?raw=true";
    };
    divProfile.appendChild(img);
    let span = document.createElement("span");
    span.className = "profile-label";
    span.innerText = "Mi perfil";
    divProfile.appendChild(span);
    let items = [
      { text: "Mi perfil", section: "perfil" },
      { text: "Ajustes de perfil", section: "ajustes" },
      { text: "Soporte", section: "soporte" },
      { text: "People For People", section: "centro" },
      { text: "Cambiar a Voluntario", isToggle: true }
    ];
    let dropdown = document.createElement("div");
    dropdown.id = "org-profile-dropdown";
    dropdown.className = "profile-dropdown";
    dropdown.style.display = "none";
    items.forEach(item => {
      let divItem = document.createElement("div");
      divItem.className = "dropdown-item";
      if (item.isToggle) {
        divItem.classList.add("mode-toggle-btn");
        divItem.style.backgroundColor = "#800080";
        divItem.style.color = "white";
        divItem.style.cursor = "pointer";
      }
      divItem.innerText = item.text;
      if (item.section) {
        divItem.setAttribute("data-section", item.section);
      }
      dropdown.appendChild(divItem);
    });
    divProfile.appendChild(dropdown);
    orgHeader.appendChild(divProfile);
    divProfile.addEventListener("click", function(e) {
      e.stopPropagation();
      dropdown.style.display = (dropdown.style.display === "none" || dropdown.style.display === "") ? "block" : "none";
    });
    let orgDropdownItems = dropdown.querySelectorAll(".dropdown-item");
    orgDropdownItems.forEach(function(item) {
      item.addEventListener("click", function(e) {
        e.stopPropagation();
        if (this.classList.contains("mode-toggle-btn")) {
          toggleUserMode();
        } else {
          dropdown.style.display = "none";
          updateProfileSubsection(this.getAttribute("data-section"));
        }
      });
    });
    document.addEventListener("click", function() {
      dropdown.style.display = "none";
    });
  }
}

/* FUNCIÓN DE ALTERNANCIA DE MODO (VOLUNTARIO <-> ORGANIZADOR) */
function toggleUserMode() {
  if (currentMode === "voluntario") {
    currentMode = "organizador";
    localStorage.setItem("userMode", "organizador");
    document.querySelectorAll(".mode-toggle-btn").forEach(b => b.textContent = "Cambiar a Voluntario");
    document.getElementById("main-app").style.display = "none";
    document.getElementById("org-mode-app").style.display = "block";
    document.getElementById("profile-dropdown").style.display = "none";
    createOrgProfileButton();
    // Mostrar el menú de organizador y cargar las listas:
    document.getElementById("org-mode-menu").style.display = "block";
    loadAdminOrganizations();
    loadOrganizadorList();
    bindOrgModeNavigation();
    // Cambiar el texto del botón que muestra la información a "Centro de Información"
    document.querySelectorAll(".org-menu-btn").forEach(function(btn) {
      if (btn.getAttribute("data-target") === "org-info") {
        btn.textContent = "Centro de Información";
      }
    });
  } else {
    currentMode = "voluntario";
    localStorage.setItem("userMode", "voluntario");
    document.querySelectorAll(".mode-toggle-btn").forEach(b => b.textContent = "Cambiar a Organizador");
    document.getElementById("org-mode-app").style.display = "none";
    document.getElementById("main-app").style.display = "block";
    document.getElementById("org-mode-menu").style.display = "none";
    document.getElementById("profile-dropdown").style.display = "none";
  }
}

/* ASIGNAR EVENTOS A LOS BOTONES DEL MENÚ INFERIOR DEL MODO ORGANIZADOR */
function bindOrgModeNavigation() {
  const orgMenuBtns = document.querySelectorAll(".org-menu-btn");
  if (!orgMenuBtns) return;
  orgMenuBtns.forEach(btn => {
    btn.addEventListener("click", function () {
      const orgSections = document.querySelectorAll(".org-content-section");
      orgSections.forEach(section => { section.style.display = "none"; });
      const target = this.getAttribute("data-target");
      if (target) {
        const targetEl = document.getElementById(target);
        if (targetEl) {
          targetEl.style.display = "block";
          if (target === "org-list") {
            loadOrganizadorList();
          }
        } else {
          console.error("No se encontró la sección con id:", target);
        }
      }
    });
  });
}

/* FUNCIÓN PARA ABRIR MODAL DE VISTA PREVIA DE ARCHIVOS */
function openModal(url, fileName) {
  let ext = "";
  if (fileName) {
    ext = fileName.split(".").pop().toLowerCase();
  } else {
    if (url.indexOf("data:image") === 0) {
      ext = "image";
    } else if (url.indexOf("data:application/pdf") === 0) {
      ext = "pdf";
    }
  }
  const modal = document.getElementById("modal-viewer");
  const modalContent = document.querySelector(".modal-content");
  modalContent.innerHTML = "";
  const closeBtn = document.createElement("span");
  closeBtn.className = "close";
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", function () { modal.style.display = "none"; });
  modalContent.appendChild(closeBtn);
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "image") {
    const img = document.createElement("img");
    img.src = url;
    modalContent.appendChild(img);
    img.addEventListener("click", function () { modal.style.display = "none"; });
  } else if (ext === "pdf") {
    const iframe = document.createElement("iframe");
    iframe.src = url;
    modalContent.appendChild(iframe);
  } else {
    const msg = document.createElement("p");
    msg.textContent = "Vista previa no disponible para este tipo de archivo.";
    modalContent.appendChild(msg);
  }
  modal.addEventListener("click", function (e) {
    if (e.target === modal) { modal.style.display = "none"; }
  });
  modal.style.display = "block";
}

/* Navegación entre sub-secciones del perfil */
function updateProfileSubsection(option) {
  const profileDisplay = document.querySelector(".profile-display");
  const profileSettings = document.querySelector(".profile-settings");
  const infoCenter = document.getElementById("info-center");
  const support = document.getElementById("support");

  if (profileDisplay) profileDisplay.style.display = "none";
  if (profileSettings) profileSettings.style.display = "none";
  if (infoCenter) infoCenter.style.display = "none";
  if (support) support.style.display = "none";

  if (option === "perfil") {
    if (profileDisplay) profileDisplay.style.display = "block";
  } else if (option === "ajustes") {
    if (profileSettings) profileSettings.style.display = "block";
  } else if (option === "soporte") {
    if (support) support.style.display = "block";
  } else if (option === "centro") {
    if (infoCenter) infoCenter.style.display = "block";
  }
}

function updateProfileView() {
  document.getElementById("profile-username-display").innerText =
    "Usuario: " + (localStorage.getItem("username") || "");
  document.getElementById("profile-name-display").innerText =
    "Nombre: " + (localStorage.getItem("profileNombre") || "");
  document.getElementById("profile-surname-display").innerText =
    "Apellido: " + (localStorage.getItem("profileApellido") || "");
  document.getElementById("profile-dob-display").innerText =
    "Fecha de nacimiento: " + (localStorage.getItem("profileDob") || "");
  document.getElementById("profile-formation-display").innerText =
    "Formación Profesional: " + (localStorage.getItem("profileFormation") || "");
  document.getElementById("profile-large-photo").src =
    localStorage.getItem("profilePhoto") || "https://via.placeholder.com/100/FFFFFF/000000?text=Perfil";
}

/* Evento para abrir el chat de soporte en el panel de administración */
function openSupportChatSession(chatId, user) {
  let modal = document.getElementById("modal-viewer");
  let modalContent = document.querySelector(".modal-content");
  modalContent.innerHTML = "";
  
  let closeBtn = document.createElement("span");
  closeBtn.className = "close";
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", function() { modal.style.display = "none"; });
  modalContent.appendChild(closeBtn);
  
  let title = document.createElement("h3");
  title.innerText = "Chat de Soporte con " + user;
  modalContent.appendChild(title);
  
  let messagesDiv = document.createElement("div");
  messagesDiv.className = "chat-messages";
  messagesDiv.style.height = "300px";
  messagesDiv.style.overflowY = "scroll";
  messagesDiv.style.border = "1px solid #ccc";
  messagesDiv.style.padding = "10px";
  modalContent.appendChild(messagesDiv);
  
  let form = document.createElement("form");
  form.id = "admin-support-chat-form";
  let input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Escribe tu respuesta";
  input.required = true;
  form.appendChild(input);
  let button = document.createElement("button");
  button.type = "submit";
  button.className = "enhanced-btn";
  button.innerText = "Enviar";
  form.appendChild(button);
  modalContent.appendChild(form);
  
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    let message = input.value.trim();
    let currentUser = activeUser;
    if(message !== ""){
      db.collection("soporte_chats").doc(chatId).collection("messages").add({
        user: currentUser,
        text: message,
        timestamp: Date.now()
      }).then(() => {
        db.collection("soporte_chats").doc(chatId).set({
          updatedAt: Date.now()
        }, { merge: true });
      }).catch(error => console.error("Error en admin soporte chat:", error));
      input.value = "";
    }
  });
  
  let unsubscribe = db.collection("soporte_chats").doc(chatId).collection("messages").orderBy("timestamp")
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if(change.type === "added"){
            let msg = change.doc.data();
            renderChatMessage(msg, messagesDiv);
          }
        });
      });
  
  let closeChatBtn = document.createElement("button");
  closeChatBtn.innerText = "Cerrar Chat";
  closeChatBtn.className = "enhanced-btn";
  closeChatBtn.style.backgroundColor = "#800080";
  closeChatBtn.style.color = "white";
  closeChatBtn.style.border = "none";
  closeChatBtn.style.borderRadius = "10px";
  closeChatBtn.style.padding = "10px 20px";
  closeChatBtn.style.cursor = "pointer";
  closeChatBtn.style.marginTop = "10px";
  closeChatBtn.addEventListener("click", function(){
      unsubscribe();
      modal.style.display = "none";
  });
  modalContent.appendChild(closeChatBtn);
  
  modal.style.display = "block";
}

/* EVENTOS PRINCIPALES */
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM completamente cargado.");

  // Cerrar mensaje de desarrollo
  const acceptBtn = document.getElementById("accept-dev-message");
  if (acceptBtn) {
    acceptBtn.addEventListener("click", function () {
      const devMessage = document.getElementById("dev-message");
      if (devMessage) {
        devMessage.style.display = "none";
      } else {
        console.error("No se encontró 'dev-message'");
      }
    });
  }

  // Registro y persistencia de usuario
  const registrationForm = document.getElementById("registration-form");
  const registrationScreen = document.getElementById("registration-screen");
  const mainApp = document.getElementById("main-app");
  const menuButtons = document.querySelectorAll(".menu-btn");
  const contentSections = document.querySelectorAll(".content-section");
  const profileBtn = document.getElementById("profile-btn");
  const defaultProfilePhoto = "https://via.placeholder.com/40/FFFFFF/FFFFFF?text=";
  const storedProfilePhoto = localStorage.getItem("profilePhoto");
  if (storedProfilePhoto && storedProfilePhoto.trim() !== "") {
    document.querySelector(".profile-img").src = storedProfilePhoto;
  } else {
    document.querySelector(".profile-img").src = defaultProfilePhoto;
  }

  function checkUserPermissions() {
    const fileUploadContainer = document.getElementById("file-upload-container");
    if (localStorage.getItem("isAdmin") === "true") {
      fileUploadContainer.style.display = "block";
    }
    console.log("checkUserPermissions:", localStorage.getItem("isAdmin"));
  }

  if (localStorage.getItem("userRegistered")) {
    registrationScreen.style.display = "none";
    mainApp.style.display = "block";
    updateProfileView();
    updateAttachmentList();
    checkUserPermissions();
  } else {
    registrationScreen.style.display = "flex";
    mainApp.style.display = "none";
  }

  registrationForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    localStorage.setItem("username", username);
    activeUser = username;
    localStorage.setItem("userRegistered", true);
    registrationScreen.style.display = "none";
    mainApp.style.display = "block";
    updateProfileView();
    updateAttachmentList();
    checkUserPermissions();
    console.log("Se registró el usuario:", username);
  });

  function showSection(sectionId) {
    contentSections.forEach(function (section) {
      section.style.display = (section.id === sectionId) ? "block" : "none";
    });
    if (sectionId === "perfil") {
      document.getElementById("info-center").style.display = "block";
      document.getElementById("support").style.display = "block";
    } else {
      document.getElementById("info-center").style.display = "none";
      document.getElementById("support").style.display = "none";
    }
  }

  menuButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const target = this.getAttribute("data-target");
      showSection(target);
    });
  });

  profileBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    const dropdown = document.getElementById("profile-dropdown");
    dropdown.style.display = (!dropdown.style.display || dropdown.style.display === "none") ? "block" : "none";
  });

  var dropdownItems = document.querySelectorAll("#profile-dropdown .dropdown-item");
  dropdownItems.forEach(function (item) {
    item.addEventListener("click", function (e) {
      e.stopPropagation();
      const selection = this.getAttribute("data-section");
      document.getElementById("profile-dropdown").style.display = "none";
      showSection("perfil");
      updateProfileView();
      updateAttachmentList();
      updateProfileSubsection(selection);
    });
  });

  document.addEventListener("click", function () {
    const dropdown = document.getElementById("profile-dropdown");
    if (dropdown) { dropdown.style.display = "none"; }
  });

  const daysArray = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  document.getElementById("dia-inicio").addEventListener("input", function () {
    document.getElementById("dia-inicio-label").textContent = daysArray[this.value];
  });
  document.getElementById("dia-fin").addEventListener("input", function () {
    document.getElementById("dia-fin-label").textContent = daysArray[this.value];
  });
  document.getElementById("hora-inicio").addEventListener("input", function () {
    document.getElementById("hora-inicio-label").textContent = this.value + ":00";
  });
  document.getElementById("hora-fin").addEventListener("input", function () {
    document.getElementById("hora-fin-label").textContent = this.value + ":00";
  });

  const fullscreenBtn = document.getElementById("fullscreen-btn");
  fullscreenBtn.addEventListener("click", function () {
    const mapContainer = document.getElementById("map-container");
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
      if (mapContainer.requestFullscreen) {
        mapContainer.requestFullscreen().then(() => {
          setTimeout(() => {
            google.maps.event.trigger(map, "resize");
            if (currentLocationMarker) { map.setCenter(currentLocationMarker.getPosition()); }
          }, 1000);
        }).catch(err => { console.error("Error al entrar en pantalla completa:", err.message); });
      } else if (mapContainer.webkitRequestFullscreen) {
        mapContainer.webkitRequestFullscreen();
        setTimeout(() => {
          google.maps.event.trigger(map, "resize");
          if (currentLocationMarker) { map.setCenter(currentLocationMarker.getPosition()); }
        }, 1000);
      } else if (mapContainer.msRequestFullscreen) {
        mapContainer.msRequestFullscreen();
        setTimeout(() => {
          google.maps.event.trigger(map, "resize");
          if (currentLocationMarker) { map.setCenter(currentLocationMarker.getPosition()); }
        }, 1000);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setTimeout(() => {
            google.maps.event.trigger(map, "resize");
            if (currentLocationMarker) { map.setCenter(currentLocationMarker.getPosition()); }
          }, 600);
        });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
        setTimeout(() => {
          google.maps.event.trigger(map, "resize");
          if (currentLocationMarker) { map.setCenter(currentLocationMarker.getPosition()); }
        }, 600);
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
        setTimeout(() => {
          google.maps.event.trigger(map, "resize");
          if (currentLocationMarker) { map.setCenter(currentLocationMarker.getPosition()); }
        }, 600);
      }
    }
  });

  /* EVENTOS PARA EL MODO ORGANIZADOR */
  document.querySelectorAll(".mode-toggle-btn").forEach(function(btn) {
    btn.addEventListener("click", function () {
      toggleUserMode();
    });
  });

  /* EVENTOS y funcionalidades del Modal para Modo Organizador */
  const closeOrgMenu = document.getElementById("close-org-menu");
  if (closeOrgMenu) {
    closeOrgMenu.addEventListener("click", function () {
      document.getElementById("org-mode-menu").style.display = "none";
    });
  }
  const crearOrgOrganizadorBtn = document.getElementById("crear-org-organizador-btn");
  if (crearOrgOrganizadorBtn) {
    crearOrgOrganizadorBtn.addEventListener("click", function(){
         document.getElementById("orgmode-list").style.display = "none";
         document.getElementById("create-org-form-orgmode-container").style.display = "block";
    });
  }
  const cancelarOrgModalBtn = document.getElementById("cancelar-org-modal");
  if (cancelarOrgModalBtn) {
    cancelarOrgModalBtn.addEventListener("click", function(){
         document.getElementById("create-org-form-orgmode-container").style.display = "none";
         document.getElementById("orgmode-list").style.display = "block";
    });
  }
  const createOrgFormOrgMode = document.getElementById("create-org-form-orgmode");
  if (createOrgFormOrgMode) {
    createOrgFormOrgMode.addEventListener("submit", function(e){
         e.preventDefault();
         const title = document.getElementById("orgmode-title").value.trim();
         const infoText = document.getElementById("orgmode-info").value.trim();
         const imageInput = document.getElementById("orgmode-image");
         let newOrg = {
              title: title,
              info: infoText,
              image: null,
              admin: activeUser,
              members: [],
              timestamp: Date.now()
         };
         if (currentLocationMarker) {
             newOrg.latitude = currentLocationMarker.getPosition().lat();
             newOrg.longitude = currentLocationMarker.getPosition().lng();
         } else {
             newOrg.latitude = 40.416775;
             newOrg.longitude = -3.70379;
         }
         function pushOrg() {
             db.collection("organizaciones").add(newOrg)
             .then(function(docRef){
                 alert("Organización creada.");
                 document.getElementById("org-mode-menu").style.display = "none";
                 newOrg.firebaseKey = docRef.id;
                 currentOrg = newOrg;
                 updateOrgInfoDisplay();
             })
             .catch(function(error){
                 console.error("Error creando organización:", error);
             });
         }
         if (imageInput.files && imageInput.files[0]) {
             const reader = new FileReader();
             reader.onload = function(e){
                 newOrg.image = e.target.result;
                 pushOrg();
             }
             reader.readAsDataURL(imageInput.files[0]);
         } else {
             pushOrg();
         }
    });
  }

  /* MÓDULO: ORGANIZACIONES (modo voluntario) */
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
      admin: activeUser,
      members: [],
      timestamp: Date.now()
    };
    if (currentLocationMarker) {
      newOrg.latitude = currentLocationMarker.getPosition().lat();
      newOrg.longitude = currentLocationMarker.getPosition().lng();
    } else {
      newOrg.latitude = 40.416775;
      newOrg.longitude = -3.70379;
    }
    function pushOrg() {
      db.collection("organizaciones").add(newOrg)
        .catch(error => console.error("Error creando organización:", error));
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

  // Actualizar listado para el modo voluntario
  db.collection("organizaciones").orderBy("timestamp").onSnapshot(function (snapshot) {
    snapshot.docChanges().forEach(function (change) {
      let org = change.doc.data();
      org.firebaseKey = change.doc.id;
      if (change.type === "added") {
        organizations.push(org);
      } else if (change.type === "modified") {
        organizations = organizations.map(o => (o.firebaseKey === org.firebaseKey ? org : o));
      } else if (change.type === "removed") {
        organizations = organizations.filter(o => o.firebaseKey !== org.firebaseKey);
      }
      updateOrgList();
    });
  });

  function updateOrgList() {
    organizations.sort((a, b) => a.timestamp - b.timestamp);
    orgListContainer.innerHTML = "";
    organizations.forEach(function (org) {
      const orgDiv = document.createElement("div");
      orgDiv.classList.add("org-item");
      orgDiv.setAttribute("data-id", org.firebaseKey);
      const container = document.createElement("div");
      container.classList.add("org-item-container");
      const leftDiv = document.createElement("div");
      leftDiv.classList.add("org-item-left");
      if (org.image) {
        const img = document.createElement("img");
        img.src = org.image;
        img.classList.add("org-thumbnail");
        img.addEventListener("click", function () {
          openModal(org.image, "jpg");
        });
        leftDiv.appendChild(img);
      }
      const titleSpan = document.createElement("span");
      titleSpan.innerText = org.title;
      leftDiv.appendChild(titleSpan);
      container.appendChild(leftDiv);
      const rightDiv = document.createElement("div");
      rightDiv.classList.add("org-item-right");
      const adminSpan = document.createElement("span");
      adminSpan.classList.add("org-admin");
      adminSpan.innerText = "Admin: " + org.admin;
      rightDiv.appendChild(adminSpan);
      if (org.admin === activeUser) {
        const deleteOrgBtn = document.createElement("button");
        deleteOrgBtn.classList.add("delete-org-btn");
        deleteOrgBtn.innerText = "Eliminar";
        deleteOrgBtn.addEventListener("click", function(e){
          e.stopPropagation();
          if(confirm("¿Eliminar esta organización?")){
            db.collection("organizaciones").doc(org.firebaseKey).delete()
              .then(() => alert("Organización eliminada"))
              .catch(error => console.error("Error eliminando organización:", error));
          }
        });
        rightDiv.appendChild(deleteOrgBtn);
      }
      container.appendChild(rightDiv);
      orgDiv.appendChild(container);
      orgListContainer.appendChild(orgDiv);
    });
  }

  orgListContainer.addEventListener("click", function (e) {
    const orgItem = e.target.closest(".org-item");
    if (orgItem) {
      const orgId = orgItem.getAttribute("data-id");
      db.collection("organizaciones").doc(orgId).get().then(function(doc) {
        if (doc.exists) {
          let org = doc.data();
          org.firebaseKey = doc.id;
          currentOrg = org;
          mostrarOrgDetalle(org);
        }
      });
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
    // Se elimina el botón de “Editar Información” de este recuadro (People For People) para no duplicar la funcionalidad.
  
    initAdminChat(org);
    initOrgChat(org);

    if (org.image) {
      const img = document.createElement("img");
      img.src = org.image;
      img.classList.add("org-thumbnail");
      img.style.cursor = "pointer";
      img.addEventListener("click", function () {
        openModal(org.image, "jpg");
      });
      orgDetailDiv.appendChild(img);
    }

    const memberList = document.getElementById("org-member-list");
    memberList.innerHTML = "";
    if (org.members && org.members.length > 0) {
      org.members.forEach(function(member) {
        const memberItem = document.createElement("li");
        memberItem.innerText = member;
        memberList.appendChild(memberItem);
      });
    } else {
      const noMembersItem = document.createElement("li");
      noMembersItem.innerText = "No hay miembros en esta organización.";
      memberList.appendChild(noMembersItem);
    }

    const orgChatContainer = document.getElementById("org-chat-messages");
    orgChatContainer.innerHTML = "";
    db.collection("organizaciones").doc(org.firebaseKey).collection("org_chat").orderBy("timestamp")
      .onSnapshot(function(snapshot) {
        snapshot.docChanges().forEach(function(change) {
          if (change.type === "added") {
            const msg = change.doc.data();
            renderChatMessage(msg, orgChatContainer);
          }
        });
      });
    currentOrg = org;
  }

  document.getElementById("volver-org-list").addEventListener("click", function () {
    orgDetailView.style.display = "none";
    orgListView.style.display = "block";
  });

  const joinOrgBtn = document.getElementById("unirse-org");
  if (joinOrgBtn) {
    joinOrgBtn.addEventListener("click", function(){
      if (!currentOrg) return;
      const currentUser = activeUser;
      if (currentOrg.admin === currentUser) {
        alert("Eres el administrador de esta organización.");
        return;
      }
      if (currentOrg.members && currentOrg.members.includes(currentUser)) {
        alert("Ya te has unido a esta organización.");
        return;
      }
      if (!currentOrg.members) {
        currentOrg.members = [];
      }
      currentOrg.members.push(currentUser);
      db.collection("organizaciones").doc(currentOrg.firebaseKey).update({ members: currentOrg.members })
        .then(() => { alert("¡Te has unido a la organización!"); })
        .catch(error => { alert("Error al unirse: " + error.message); });
    });
  }

  document.getElementById("org-chat-form").onsubmit = function(e) {
    e.preventDefault();
    const input = document.getElementById("org-chat-input");
    const message = input.value.trim();
    if (message !== "" && currentOrg) {
      db.collection("organizaciones").doc(currentOrg.firebaseKey).collection("org_chat").add({
        user: activeUser,
        text: message,
        timestamp: Date.now()
      }).catch(function(error) {
        console.error("Error en org chat:", error);
      });
      input.value = "";
    }
  };

  /* MÓDULO: PUNTOS DE AYUDA */
  const ayudaListView = document.getElementById("ayuda-list-view");
  const ayudaCreateForm = document.getElementById("ayuda-create-form");
  const ayudaDetailView = document.getElementById("ayuda-detail-view");
  const ayudaListContainer = document.getElementById("ayuda-list");

  document.getElementById("mostrar-ayuda-create").addEventListener("click", function () {
    ayudaCreateForm.style.display = "block";
    ayudaListView.style.display = "none";
  });
  document.getElementById("cancelar-ayuda").addEventListener("click", function () {
    ayudaCreateForm.style.display = "none";
    ayudaListView.style.display = "block";
  });
  document.getElementById("crear-ayuda-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const titulo = document.getElementById("ayuda-titulo").value.trim();
    const info = document.getElementById("ayuda-info").value.trim();
    const imageInput = document.getElementById("ayuda-image");
    let newAyuda = {
      titulo: titulo,
      info: info,
      creator: activeUser,
      timestamp: Date.now()
    };
    if (currentLocationMarker) {
      newAyuda.latitude = currentLocationMarker.getPosition().lat();
      newAyuda.longitude = currentLocationMarker.getPosition().lng();
    } else {
      newAyuda.latitude = 40.416775;
      newAyuda.longitude = -3.70379;
    }
    function pushAyuda() {
      db.collection("ayuda").add(newAyuda)
        .catch(error => console.error("Error en crear punto de ayuda:", error));
    }
    if (imageInput.files && imageInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        newAyuda.image = e.target.result;
        pushAyuda();
      };
      reader.readAsDataURL(imageInput.files[0]);
    } else {
      pushAyuda();
    }
    this.reset();
    ayudaCreateForm.style.display = "none";
    ayudaListView.style.display = "block";
  });

  db.collection("ayuda").orderBy("timestamp").onSnapshot(function (snapshot) {
    snapshot.docChanges().forEach(function (change) {
      let ayuda = change.doc.data();
      ayuda.firebaseKey = change.doc.id;
      if (change.type === "added") {
        ayudaItems.push(ayuda);
        updateAyudaList();
        addHelpMarker(ayuda);
      } else if (change.type === "modified") {
        ayudaItems = ayudaItems.map(a => a.firebaseKey === ayuda.firebaseKey ? ayuda : a);
        updateAyudaList();
      } else if (change.type === "removed") {
        ayudaItems = ayudaItems.filter(a => a.firebaseKey !== ayuda.firebaseKey);
        updateAyudaList();
        removeHelpMarker(ayuda.firebaseKey);
      }
    });
  });

  function updateAyudaList() {
    ayudaListContainer.innerHTML = "";
    ayudaItems.sort((a, b) => a.timestamp - b.timestamp);
    ayudaItems.forEach(function (item) {
      const itemDiv = document.createElement("div");
      itemDiv.classList.add("ayuda-item");
      itemDiv.setAttribute("data-id", item.firebaseKey);
      itemDiv.innerText = item.titulo + " - " + item.creator;
      ayudaListContainer.appendChild(itemDiv);
    });
  }

  ayudaListContainer.addEventListener("click", function (e) {
    const itemDiv = e.target.closest(".ayuda-item");
    if (itemDiv) {
      const id = itemDiv.getAttribute("data-id");
      db.collection("ayuda").doc(id).get().then(function(doc) {
        if (doc.exists) {
          let ayuda = doc.data();
          ayuda.firebaseKey = doc.id;
          showAyudaDetail(ayuda);
        }
      });
    }
  });

  function showAyudaDetail(ayuda) {
    ayudaListView.style.display = "none";
    ayudaCreateForm.style.display = "none";
    const ayudaDetailDiv = document.getElementById("ayuda-detail");
    ayudaDetailDiv.innerHTML = "";
    const title = document.createElement("h3");
    title.innerText = ayuda.titulo;
    ayudaDetailDiv.appendChild(title);
    const infoP = document.createElement("p");
    infoP.innerText = "Info: " + ayuda.info;
    ayudaDetailDiv.appendChild(infoP);
    const creatorP = document.createElement("p");
    creatorP.innerText = "Creado por: " + ayuda.creator;
    ayudaDetailDiv.appendChild(creatorP);
    if (ayuda.image) {
      const img = document.createElement("img");
      img.src = ayuda.image;
      img.style.maxWidth = "100px";
      img.style.marginBottom = "10px";
      img.style.cursor = "pointer";
      img.addEventListener("click", function () {
        openModal(ayuda.image, "jpg");
      });
      ayudaDetailDiv.appendChild(img);
    }
    if (activeUser === ayuda.creator) {
      const deleteHelpBtn = document.createElement("button");
      deleteHelpBtn.className = "delete-btn";
      deleteHelpBtn.innerText = "Eliminar Punto de Ayuda";
      deleteHelpBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (confirm("¿Estás seguro de eliminar este punto de ayuda?")) {
          db.collection("ayuda").doc(ayuda.firebaseKey).delete()
            .then(() => {
              alert("Punto de ayuda eliminado");
              document.getElementById("ayuda-detail-view").style.display = "none";
              ayudaListView.style.display = "block";
            })
            .catch(error => console.error("Error eliminando punto de ayuda:", error));
        }
      });
      ayudaDetailDiv.appendChild(deleteHelpBtn);
    }
    const ayudaChatContainer = document.getElementById("ayuda-chat-messages");
    ayudaChatContainer.innerHTML = "";
    db.collection("ayuda_chat").doc(ayuda.firebaseKey).collection("messages").orderBy("timestamp")
      .onSnapshot(function(snapshot) {
        snapshot.docChanges().forEach(function(change) {
          if (change.type === "added") {
            const msg = change.doc.data();
            renderChatMessage(msg, ayudaChatContainer);
          }
        });
      });
    currentAyuda = ayuda;
    const smallMap = new google.maps.Map(document.getElementById("small-map"), {
      center: { lat: ayuda.latitude, lng: ayuda.longitude },
      zoom: 15,
    });
    new google.maps.Marker({
      position: { lat: ayuda.latitude, lng: ayuda.longitude },
      map: smallMap,
      title: "Punto de Ayuda: " + ayuda.titulo,
      icon: helpIcon
    });
    document.getElementById("ayuda-detail-view").style.display = "block";
  }

  document.getElementById("volver-ayuda-list").addEventListener("click", function () {
    document.getElementById("ayuda-detail-view").style.display = "none";
    ayudaListView.style.display = "block";
  });

  /* MÓDULO: VOLUNTARIOS */
  const voluntarioListView = document.getElementById("voluntario-list-view");
  const voluntarioCreateForm = document.getElementById("voluntario-create-form");
  const voluntarioDetailView = document.getElementById("voluntario-detail-view");
  const voluntarioListContainer = document.getElementById("voluntario-list");

  document.getElementById("mostrar-voluntario-create").addEventListener("click", function () {
    const currentUser = activeUser;
    db.collection("voluntarios").where("user", "==", currentUser).get().then(function(querySnapshot) {
      if (!querySnapshot.empty) {
        alert("Ya te has ofrecido como voluntario.");
        return;
      }
      voluntarioCreateForm.style.display = "block";
    });
  });
  document.getElementById("cancelar-voluntario").addEventListener("click", function () {
    voluntarioCreateForm.style.display = "none";
    voluntarioListView.style.display = "block";
  });
  document.getElementById("crear-voluntario-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const diaInicioVal = document.getElementById("dia-inicio").value;
    const diaFinVal = document.getElementById("dia-fin").value;
    const horaInicioVal = document.getElementById("hora-inicio").value;
    const horaFinVal = document.getElementById("hora-fin").value;
    const horarioTexto =
      daysArray[diaInicioVal] +
      " a " +
      daysArray[diaFinVal] +
      ", " +
      horaInicioVal +
      ":00 a " +
      horaFinVal +
      ":00";
    let newVoluntario = {
      user: activeUser,
      diaInicio: diaInicioVal,
      diaFin: diaFinVal,
      horaInicio: horaInicioVal,
      horaFin: horaFinVal,
      horarioTexto: horarioTexto,
      timestamp: Date.now()
    };
    if (currentLocationMarker) {
      newVoluntario.latitude = currentLocationMarker.getPosition().lat();
      newVoluntario.longitude = currentLocationMarker.getPosition().lng();
    } else {
      newVoluntario.latitude = 40.416775;
      newVoluntario.longitude = -3.70379;
    }
    const habilidades = document.getElementById("voluntario-habilidades").value.trim();
    newVoluntario.habilidades = habilidades;

    db.collection("voluntarios").add(newVoluntario)
      .catch(error => console.error("Error creando voluntario:", error));
    this.reset();
    voluntarioCreateForm.style.display = "none";
  });

  db.collection("voluntarios").orderBy("timestamp").onSnapshot(function (snapshot) {
    snapshot.docChanges().forEach(function (change) {
      let vol = change.doc.data();
      vol.firebaseKey = change.doc.id;
      if (change.type === "added") {
        voluntarioItems.push(vol);
        updateVoluntarioList();
        addVolunteerMarker(vol);
      } else if (change.type === "modified") {
        voluntarioItems = voluntarioItems.map(v => (v.firebaseKey === vol.firebaseKey ? vol : v));
        updateVoluntarioList();
      } else if (change.type === "removed") {
        voluntarioItems = voluntarioItems.filter(v => v.firebaseKey !== vol.firebaseKey);
        updateVoluntarioList();
        removeVolunteerMarker(vol.firebaseKey);
      }
    });
  });

  function updateVoluntarioList() {
    voluntarioListContainer.innerHTML = "";
    voluntarioItems.sort((a, b) => a.timestamp - b.timestamp);
    voluntarioItems.forEach(function (item) {
      const itemDiv = document.createElement("div");
      itemDiv.classList.add("voluntario-item");
      itemDiv.setAttribute("data-id", item.firebaseKey);
      const infoDiv = document.createElement("div");
      infoDiv.classList.add("voluntario-info");
      infoDiv.innerText = item.user + " - " + item.horarioTexto;
      itemDiv.appendChild(infoDiv);
      if (item.user === activeUser) {
        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("voluntario-actions");
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.innerText = "Eliminar";
        deleteBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          if (confirm("¿Deseas eliminar tu oferta de voluntariado?")) {
            db.collection("voluntarios").doc(item.firebaseKey).delete();
          }
        });
        actionsDiv.appendChild(deleteBtn);
        itemDiv.appendChild(actionsDiv);
      }
      voluntarioListContainer.appendChild(itemDiv);
    });
  }

  voluntarioListContainer.addEventListener("click", function (e) {
    const itemDiv = e.target.closest(".voluntario-item");
    if (itemDiv) {
      const id = itemDiv.getAttribute("data-id");
      db.collection("voluntarios").doc(id).get().then(function(doc) {
        if (doc.exists) {
          let vol = doc.data();
          vol.firebaseKey = doc.id;
          showVoluntarioDetail(vol);
        }
      });
    }
  });

  function showVoluntarioDetail(vol) {
    voluntarioListView.style.display = "none";
    voluntarioCreateForm.style.display = "none";
    const voluntarioDetailDiv = document.getElementById("voluntario-detail");
    voluntarioDetailDiv.innerHTML = "";

    const detailContainer = document.createElement("div");
    detailContainer.style.display = "flex";
    detailContainer.style.justifyContent = "space-between";
    detailContainer.style.alignItems = "flex-start";

    const leftColumn = document.createElement("div");
    leftColumn.style.flex = "1";
    leftColumn.style.marginRight = "20px";

    const infoHeader = document.createElement("h3");
    infoHeader.innerText = "Detalle del Voluntario";
    leftColumn.appendChild(infoHeader);

    const horarioP = document.createElement("p");
    horarioP.innerText = "Horario: " + vol.horarioTexto;
    leftColumn.appendChild(horarioP);

    const userP = document.createElement("p");
    userP.innerText = "Ofrecido por: " + vol.user;
    leftColumn.appendChild(userP);

    const habilidadesP = document.createElement("p");
    habilidadesP.innerText = "Habilidades: " + (vol.habilidades || "No especificadas");
    leftColumn.appendChild(horarioP);
    leftColumn.appendChild(habilidadesP);

    const profileDiv = document.createElement("div");
    profileDiv.id = "voluntario-profile-info";
    profileDiv.innerHTML =
      "<p>Nombre: " + (localStorage.getItem("profileNombre") || "No definido") + "</p>" +
      "<p>Apellido: " + (localStorage.getItem("profileApellido") || "No definido") + "</p>" +
      "<p>Fecha de Nacimiento: " + (localStorage.getItem("profileDob") || "No definida") + "</p>" +
      "<p>Formación Profesional: " + (localStorage.getItem("profileFormation") || "No definida") + "</p>";
    leftColumn.appendChild(profileDiv);

    detailContainer.appendChild(leftColumn);

    const rightColumn = document.createElement("div");
    rightColumn.style.flexShrink = "0";
    rightColumn.style.display = "flex";
    rightColumn.style.alignItems = "center";
    const profileImg = document.createElement("img");
    profileImg.src = localStorage.getItem("profilePhoto") || "https://via.placeholder.com/100/FFFFFF/000000?text=Perfil";
    profileImg.style.width = "100px";
    profileImg.style.height = "100px";
    profileImg.style.borderRadius = "50%";
    rightColumn.appendChild(profileImg);
    detailContainer.appendChild(rightColumn);

    voluntarioDetailDiv.appendChild(detailContainer);

    const privateChatDiv = document.createElement("div");
    privateChatDiv.id = "voluntario-private-chat";
    privateChatDiv.innerHTML =
      "<h3>Chat Privado con " + vol.user + "</h3>" +
      "<div class='chat-messages' id='voluntario-private-chat-messages'></div>" +
      "<form id='voluntario-private-chat-form'><input type='text' id='voluntario-private-chat-input' placeholder='Escribe tu mensaje' required /><button type='submit' class='enhanced-btn'>Enviar</button></form>";
    voluntarioDetailDiv.appendChild(privateChatDiv);

    const currentUser = activeUser;
    const chatKey = [currentUser, vol.user].sort().join("_");
    const privateChatMessagesDiv = document.getElementById("voluntario-private-chat-messages");
    privateChatMessagesDiv.innerHTML = "";
    db.collection("voluntario_chat")
      .doc(chatKey)
      .collection("messages")
      .orderBy("timestamp")
      .onSnapshot(function(snapshot) {
        snapshot.docChanges().forEach(function(change) {
          if (change.type === "added") {
            const msg = change.doc.data();
            renderChatMessage(msg, privateChatMessagesDiv);
          }
        });
      });
    const privateChatForm = document.getElementById("voluntario-private-chat-form");
    privateChatForm.onsubmit = function (e) {
      e.preventDefault();
      const chatInput = document.getElementById("voluntario-private-chat-input");
      const message = chatInput.value.trim();
      if (message !== "") {
        db.collection("voluntario_chat")
          .doc(chatKey)
          .collection("messages")
          .add({
            user: activeUser,
            text: message,
            timestamp: Date.now()
          })
          .catch(error => console.error("Error en chat privado:", error));
        chatInput.value = "";
      }
    };
    currentVoluntario = vol;
    voluntarioDetailDiv.style.display = "block";
  }

  document.getElementById("volver-voluntario-list").addEventListener("click", function () {
    voluntarioDetailView.style.display = "none";
    voluntarioListView.style.display = "block";
  });

  /* MÓDULO: MI PERFIL */
  const profileTabButtons = document.querySelectorAll(".profile-tab-btn");
  profileTabButtons.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      profileTabButtons.forEach(function (b) { b.classList.remove("active"); });
      const tabContents = document.querySelectorAll(".profile-tab-content");
      tabContents.forEach(function (tc) { tc.style.display = "none"; tc.classList.remove("active"); });
      this.classList.add("active");
      const target = this.getAttribute("data-target");
      const content = document.getElementById(target);
      content.style.display = "block";
      content.classList.add("active");
    });
  });

  // AÑADIR BOTÓN DE CERRAR SESIÓN EN AJUSTES DE PERFIL
  if (document.getElementById("profile-settings")) {
    const closeSessionBtn = document.createElement("button");
    closeSessionBtn.innerText = "Cerrar Sesión";
    closeSessionBtn.classList.add("action-btn");
    closeSessionBtn.addEventListener("click", function(){
      localStorage.removeItem("userRegistered");
      localStorage.removeItem("username");
      window.location.href = window.location.href;
    });
    document.getElementById("profile-settings").appendChild(closeSessionBtn);
  }

  document.getElementById("profile-datos-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const nombre = document.getElementById("profile-nombre").value.trim();
    const apellido = document.getElementById("profile-apellido").value.trim();
    const dob = document.getElementById("profile-dob").value;
    localStorage.setItem("profileNombre", nombre);
    localStorage.setItem("profileApellido", apellido);
    localStorage.setItem("profileDob", dob);
    updateProfileView();
    alert("Datos personales actualizados");
  });

  document.getElementById("profile-formacion-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const titulo = document.getElementById("profile-titulo").value.trim();
    const institucion = document.getElementById("profile-institucion").value.trim();
    const anio = document.getElementById("profile-anio").value;
    const formation = titulo + " - " + institucion + " (" + anio + ")";
    localStorage.setItem("profileFormation", formation);
    updateProfileView();
    alert("Formación profesional actualizada");
  });

  // EVENTOS DEL ADMIN PANEL
  var adminPanelLink = document.getElementById("admin-panel-link");
  var adminPanel = document.getElementById("admin-panel");
  adminPanelLink.addEventListener("click", function () {
    adminPanel.style.display = (adminPanel.style.display === "none" || adminPanel.style.display === "") ? "block" : "none";
    console.log("Se hizo clic en Panel de Administrador.");
  });

  var adminLoginForm = document.getElementById("admin-login-form");
  adminLoginForm.addEventListener("submit", function(e) {
    e.preventDefault();
    var adminEmail = document.getElementById("admin-email").value.trim();
    var adminPassword = document.getElementById("admin-password").value.trim();
    if(adminEmail === "peopleforpeopleofficial@gmail.com" && adminPassword === "PeopleFP"){
       var normalUser = localStorage.getItem("username");
       localStorage.setItem("normalUsername", normalUser);
       localStorage.setItem("username", "Administrador");
       activeUser = "Administrador";
       localStorage.setItem("isAdmin", "true");
       alert("Acceso de administrador concedido.");
       adminLoginForm.style.display = "none";
       document.getElementById("admin-content").style.display = "block";
       checkUserPermissions();
    } else {
       alert("Credenciales inválidas. Inténtalo de nuevo.");
    }
  });

  document.getElementById("admin-content").addEventListener("click", function(e) {
    if (e.target && e.target.id === "admin-logout-btn") {
      localStorage.removeItem("isAdmin");
      var normalUser = localStorage.getItem("normalUsername");
      if(normalUser){
         localStorage.setItem("username", normalUser);
         activeUser = normalUser;
         localStorage.removeItem("normalUsername");
      }
      alert("Sesión de administrador cerrada.");
      document.getElementById("admin-content").style.display = "none";
      document.getElementById("admin-login-form").style.display = "block";
      checkUserPermissions();
    }
  });

  var adminEditForm = document.getElementById("admin-edit-form");
  adminEditForm.addEventListener("submit", function(e) {
      e.preventDefault();
      var newInfo = document.getElementById("admin-info").value.trim();
      localStorage.setItem("adminInfo", newInfo);
      alert("Información actualizada exitosamente.");
      adminEditForm.reset();
  });

  var adminUploadForm = document.getElementById("admin-upload-form");
  adminUploadForm.addEventListener("submit", function(e){
      e.preventDefault();
      var title = document.getElementById("admin-attachment-title").value.trim();
      var fileInput = document.getElementById("admin-attachment-file");
      if(fileInput.files.length === 0){
          document.getElementById("admin-upload-message").innerText = "Por favor, selecciona un archivo.";
          return;
      }
      var file = fileInput.files[0];
      var reader = new FileReader();
      reader.onload = function(ev){
         var newAttachment = {
             title: title,
             fileName: file.name,
             fileUrl: ev.target.result,
             visibility: "public",
             timestamp: Date.now()
         };
         db.collection("public_files").add(newAttachment)
          .then(function(){
              document.getElementById("admin-upload-message").innerText = "Archivo subido exitosamente.";
              adminUploadForm.reset();
          })
          .catch(function(error){
              console.error("Error al subir el archivo:", error);
              document.getElementById("admin-upload-message").innerText = "Error al subir el archivo.";
          });
      };
      reader.readAsDataURL(file);
  });

  // NUEVAS FUNCIONALIDADES: CHAT DE SOPORTE Y FEEDBACK
  if(document.getElementById("soporte-chat-form")) {
     document.getElementById("soporte-chat-form").addEventListener("submit", function(e){
         e.preventDefault();
         let message = document.getElementById("soporte-chat-input").value.trim();
         if(message !== ""){
             let currentUser = activeUser;
             let chatId = "chat_" + currentUser;
             db.collection("soporte_chats").doc(chatId).collection("messages").add({
                  user: currentUser,
                  text: message,
                  timestamp: Date.now()
             }).then(() => {
                  db.collection("soporte_chats").doc(chatId).set({
                     user: currentUser,
                     updatedAt: Date.now()
                  }, { merge: true });
             }).catch(error => console.error("Error enviando mensaje de soporte:", error));
             document.getElementById("soporte-chat-input").value = "";
         }
     });
     
     let currentUser = activeUser;
     let chatId = "chat_" + currentUser;
     let soporteChatMessages = document.getElementById("soporte-chat-messages");
     db.collection("soporte_chats").doc(chatId).collection("messages").orderBy("timestamp")
         .onSnapshot(snapshot => {
             snapshot.docChanges().forEach(change => {
                 if(change.type === "added"){
                     let msg = change.doc.data();
                     renderChatMessage(msg, soporteChatMessages);
                 }
             });
         });
  }

  if(document.getElementById("feedback-form")) {
      document.getElementById("feedback-form").addEventListener("submit", function(e){
          e.preventDefault();
          let feedbackText = document.getElementById("feedback-text").value.trim();
          let currentUser = activeUser;
          db.collection("feedback").add({
             user: currentUser,
             text: feedbackText,
             timestamp: Date.now()
          }).then(() => {
             alert("Comentario enviado. ¡Gracias por tu sugerencia!");
             document.getElementById("feedback-text").value = "";
          }).catch(error => console.error("Error enviando feedback:", error));
      });
  }

  if(document.getElementById("admin-support-chats-list")) {
       db.collection("soporte_chats").orderBy("updatedAt", "desc")
         .onSnapshot(snapshot => {
             let container = document.getElementById("admin-support-chats-list");
             container.innerHTML = "";
             snapshot.forEach(doc => {
                 let chatData = doc.data();
                 let chatId = doc.id;
                 let chatDiv = document.createElement("div");
                 chatDiv.className = "admin-chat-session";
                 chatDiv.style.borderBottom = "1px solid #eee";
                 chatDiv.style.padding = "5px";
                 chatDiv.innerText = "Chat con " + chatData.user;
                 chatDiv.addEventListener("click", function(){
                     openSupportChatSession(chatId, chatData.user);
                 });
                 container.appendChild(chatDiv);
             });
         });
  }

  const adminLogoutBtn = document.getElementById("admin-logout-btn");
  if(adminLogoutBtn) {
    adminLogoutBtn.style.backgroundColor = "#800080";
    adminLogoutBtn.style.color = "white";
    adminLogoutBtn.style.border = "none";
    adminLogoutBtn.style.borderRadius = "10px";
    adminLogoutBtn.style.padding = "10px 20px";
    adminLogoutBtn.style.cursor = "pointer";
  }

  // EVENTO PARA EDITAR LA INFORMACIÓN de People for People.
  // Se ha quitado el botón dentro del recuadro de centro de información;
  // ahora la edición se realiza en el recuadro de información (org-info-edit)
  // y se guarda mediante el formulario "org-info-edit-form" sin alterar el módulo de perfil.
  document.getElementById("org-info-edit-form").addEventListener("submit", function(e) {
    e.preventDefault();
    const newTitle = document.getElementById("edit-org-titulo").value.trim();
    const newAdmin = document.getElementById("edit-org-creador").value.trim();
    const newInfo = document.getElementById("edit-org-detalle").value.trim();
    const newLugar = document.getElementById("edit-org-lugar").value.trim();
    const newFecha = document.getElementById("edit-org-fecha").value;
    db.collection("organizaciones").doc(currentOrg.firebaseKey).update({
      title: newTitle,
      admin: newAdmin,
      info: newInfo,
      lugar: newLugar,
      timestamp: new Date(newFecha).getTime()
    }).then(() => {
      alert("People for People actualizada.");
      cancelOrgInfoEditing();
    }).catch(error => console.error("Error actualizando People for People:", error));
  });

  // EVENTO PARA CERRAR SESIÓN desde Ajustes de Perfil
  // Este botón estará en el módulo de ajustes de perfil y redirige al formulario de registro.
  document.getElementById("logout-btn").addEventListener("click", function () {
    localStorage.removeItem("userRegistered");
    localStorage.removeItem("username");
    window.location.href = window.location.href;
  });
});
/* --- FIN DEL DOMCONTENTLOADED --- */
