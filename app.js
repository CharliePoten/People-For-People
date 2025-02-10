/* VARIABLES GLOBALES */
var map;
var currentLocationMarker = null;
var organizations = [];
var currentOrg = null;
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
var database = firebase.database();

/* ÍCONOS DE GOOGLE MAPS */
const helpIcon = "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
const volunteerIcon = "http://maps.google.com/mapfiles/ms/icons/purple-dot.png";
const currentLocationIcon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";

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

/* Funciones de Chat */
function renderChatMessage(msg, container) {
  const currentUser = localStorage.getItem("username") || "Tú";
  const msgDiv = document.createElement("div");
  msgDiv.style.display = "flex";
  msgDiv.style.marginBottom = "8px";
  msgDiv.style.justifyContent = (msg.user === currentUser) ? "flex-end" : "flex-start";
  const usernameSpan = document.createElement("span");
  usernameSpan.classList.add("chat-username");
  usernameSpan.innerText = msg.user + ": ";
  usernameSpan.style.color = (msg.user === currentUser) ? "blue" : getUserColor(msg.user);
  const messageSpan = document.createElement("span");
  messageSpan.classList.add("chat-text");
  messageSpan.innerText = msg.text;
  msgDiv.appendChild(usernameSpan);
  msgDiv.appendChild(messageSpan);
  container.appendChild(msgDiv);
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

/* Funciones para marcadores de Ayuda */
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

/* Funciones para marcadores de Voluntarios */
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

/* Fullscreen del mapa */
document.addEventListener("fullscreenchange", function () {
  const mapContainer = document.getElementById("map-container");
  if (document.fullscreenElement) {
    mapContainer.classList.add("fullscreen");
  } else {
    mapContainer.classList.remove("fullscreen");
  }
});

document.addEventListener("DOMContentLoaded", function () {
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

  if (localStorage.getItem("userRegistered")) {
    registrationScreen.style.display = "none";
    mainApp.style.display = "block";
    updateProfileView();
    updateAttachmentList();
  } else {
    registrationScreen.style.display = "flex";
    mainApp.style.display = "none";
  }

  registrationForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    localStorage.setItem("username", username);
    localStorage.setItem("userRegistered", true);
    registrationScreen.style.display = "none";
    mainApp.style.display = "block";
    updateProfileView();
    updateAttachmentList();
  });

  function showSection(sectionId) {
    contentSections.forEach(function (section) {
      section.style.display = (section.id === sectionId) ? "block" : "none";
    });
  }
  menuButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const target = this.getAttribute("data-target");
      showSection(target);
    });
  });
  profileBtn.addEventListener("click", function () {
    showSection("perfil");
    updateProfileView();
    updateAttachmentList();
  });

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
    // Actualizar foto de perfil grande en "Mi Perfil"
    document.getElementById("profile-large-photo").src =
      localStorage.getItem("profilePhoto") || "https://via.placeholder.com/100/FFFFFF/000000?text=Perfil";
  }

  /* Sliders de Voluntarios */
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

  /* Botón de Pantalla Completa para el mapa */
  const fullscreenBtn = document.getElementById("fullscreen-btn");
  fullscreenBtn.addEventListener("click", function () {
    const mapContainer = document.getElementById("map-container");
    if (!document.fullscreenElement) {
      mapContainer.requestFullscreen().then(() => {
        setTimeout(() => {
          google.maps.event.trigger(map, "resize");
          if (currentLocationMarker) {
            map.setCenter(currentLocationMarker.getPosition());
          }
        }, 1000);
      }).catch(err => {
        console.error(`No se pudo activar Pantalla Completa: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setTimeout(() => {
          google.maps.event.trigger(map, "resize");
          if (currentLocationMarker) {
            map.setCenter(currentLocationMarker.getPosition());
          }
        }, 600);
      });
    }
  });

  /* MÓDULO: Organizaciones */
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

      const adminSpan = document.createElement("span");
      adminSpan.classList.add("org-admin");
      adminSpan.innerText = "Admin: " + org.admin;
      container.appendChild(adminSpan);

      orgDiv.appendChild(container);
      orgListContainer.appendChild(orgDiv);
    });
  }
  orgListContainer.addEventListener("click", function (e) {
    const orgItem = e.target.closest(".org-item");
    if (orgItem) {
      const orgId = orgItem.getAttribute("data-id");
      const org = organizations.find(o => o.firebaseKey === orgId);
      if (org) {
        currentOrg = org;
        mostrarOrgDetalle(org);
      }
    }
  });
  database.ref("organizaciones").on("child_added", function (snapshot) {
    let org = snapshot.val();
    org.firebaseKey = snapshot.key;
    organizations.push(org);
    updateOrgList();
  });
  database.ref("organizaciones").on("child_changed", function (snapshot) {
    let updatedOrg = snapshot.val();
    updatedOrg.firebaseKey = snapshot.key;
    organizations = organizations.map(o => (o.firebaseKey === updatedOrg.firebaseKey ? updatedOrg : o));
    updateOrgList();
  });
  database.ref("organizaciones").on("child_removed", function (snapshot) {
    const removedKey = snapshot.key;
    organizations = organizations.filter(org => org.firebaseKey !== removedKey);
    updateOrgList();
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
      img.classList.add("org-thumbnail");
      img.style.cursor = "pointer";
      img.addEventListener("click", function () {
        openModal(org.image, "jpg");
      });
      orgDetailDiv.appendChild(img);
    }
    const orgChatContainer = document.getElementById("org-chat-messages");
    orgChatContainer.innerHTML = "";
    var chatRef = database.ref("org_chat/" + org.firebaseKey);
    chatRef.off();
    chatRef.on("child_added", function (snapshot) {
      const msg = snapshot.val();
      renderChatMessage(msg, orgChatContainer);
    });
    currentOrg = org;
  }
  document.getElementById("volver-org-list").addEventListener("click", function () {
    orgDetailView.style.display = "none";
    orgListView.style.display = "block";
  });

  // Event listener para el botón "Unirse a Organización"
  const joinOrgBtn = document.getElementById("unirse-org");
  if (joinOrgBtn) {
    joinOrgBtn.addEventListener("click", function() {
      if (!currentOrg) return;
      const currentUser = localStorage.getItem("username");
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
      database.ref("organizaciones/" + currentOrg.firebaseKey).update({ members: currentOrg.members }, function(error) {
        if (error) {
          alert("Error al unirse: " + error.message);
        } else {
          alert("¡Te has unido a la organización!");
        }
      });
    });
  }

  /* MÓDULO: Puntos de Ayuda */
  let ayudaItems = [];
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
      creator: localStorage.getItem("username") || "Anónimo",
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
      database.ref("ayuda").push(newAyuda, function (error) {
        if (error) {
          console.error("Error creando punto de ayuda", error);
        }
      });
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
  database.ref("ayuda").on("child_added", function (snapshot) {
    let ayuda = snapshot.val();
    ayuda.firebaseKey = snapshot.key;
    ayudaItems.push(ayuda);
    updateAyudaList();
    addHelpMarker(ayuda);
  });
  database.ref("ayuda").on("child_changed", function (snapshot) {
    let updatedAyuda = snapshot.val();
    updatedAyuda.firebaseKey = snapshot.key;
    ayudaItems = ayudaItems.map(a => (a.firebaseKey === updatedAyuda.firebaseKey ? updatedAyuda : a));
    updateAyudaList();
  });
  database.ref("ayuda").on("child_removed", function (snapshot) {
    const removedKey = snapshot.key;
    ayudaItems = ayudaItems.filter(item => item.firebaseKey !== removedKey);
    updateAyudaList();
    removeHelpMarker(removedKey);
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
      const ayuda = ayudaItems.find(a => a.firebaseKey === id);
      if (ayuda) {
        showAyudaDetail(ayuda);
      }
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
    const ayudaChatContainer = document.getElementById("ayuda-chat-messages");
    ayudaChatContainer.innerHTML = "";
    var chatRef = database.ref("ayuda_chat/" + ayuda.firebaseKey);
    chatRef.off();
    chatRef.on("child_added", function (snapshot) {
      const msg = snapshot.val();
      renderChatMessage(msg, ayudaChatContainer);
    });
    currentAyuda = ayuda;
    document.getElementById("ayuda-detail-view").style.display = "block";
  }
  document.getElementById("volver-ayuda-list").addEventListener("click", function () {
    document.getElementById("ayuda-detail-view").style.display = "none";
    ayudaListView.style.display = "block";
  });
  document.getElementById("ayuda-chat-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const username = localStorage.getItem("username") || "Tú";
    const input = document.getElementById("ayuda-chat-input");
    const message = input.value.trim();
    if (message !== "" && currentAyuda) {
      var chatRef = database.ref("ayuda_chat/" + currentAyuda.firebaseKey);
      chatRef.push({ user: username, text: message, timestamp: Date.now() });
      input.value = "";
    }
  });

  /* MÓDULO: Voluntarios */
  let voluntarioItems = [];
  const voluntarioListView = document.getElementById("voluntario-list-view");
  const voluntarioCreateForm = document.getElementById("voluntario-create-form");
  const voluntarioDetailView = document.getElementById("voluntario-detail-view");
  const voluntarioListContainer = document.getElementById("voluntario-list");

  document.getElementById("mostrar-voluntario-create").addEventListener("click", function () {
    const currentUser = localStorage.getItem("username");
    if (voluntarioItems.some(v => v.user === currentUser)) {
      alert("Ya te has ofrecido como voluntario.");
      return;
    }
    voluntarioCreateForm.style.display = "block";
    voluntarioListView.style.display = "none";
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
      user: localStorage.getItem("username") || "Tú",
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
    database.ref("voluntarios").push(newVoluntario, function (error) {
      if (error) {
        console.error("Error creando voluntario:", error);
      }
    });
    this.reset();
    voluntarioCreateForm.style.display = "none";
    voluntarioListView.style.display = "block";
  });
  database.ref("voluntarios").on("child_added", function (snapshot) {
    let vol = snapshot.val();
    vol.firebaseKey = snapshot.key;
    voluntarioItems.push(vol);
    updateVoluntarioList();
    addVolunteerMarker(vol);
  });
  database.ref("voluntarios").on("child_changed", function (snapshot) {
    let updatedVol = snapshot.val();
    updatedVol.firebaseKey = snapshot.key;
    voluntarioItems = voluntarioItems.map(v =>
      v.firebaseKey === updatedVol.firebaseKey ? updatedVol : v
    );
    updateVoluntarioList();
  });
  database.ref("voluntarios").on("child_removed", function (snapshot) {
    const removedKey = snapshot.key;
    voluntarioItems = voluntarioItems.filter(item => item.firebaseKey !== removedKey);
    updateVoluntarioList();
    removeVolunteerMarker(removedKey);
  });
  function updateVoluntarioList() {
    voluntarioListContainer.innerHTML = "";
    voluntarioItems.sort((a, b) => a.timestamp - b.timestamp);
    voluntarioItems.forEach(function (item) {
      const itemDiv = document.createElement("div");
      itemDiv.classList.add("voluntario-item");
      itemDiv.setAttribute("data-id", item.firebaseKey);

      // Sección izquierda para la información
      const infoDiv = document.createElement("div");
      infoDiv.classList.add("voluntario-info");
      infoDiv.innerText = item.user + " - " + item.horarioTexto;
      itemDiv.appendChild(infoDiv);

      // Sección derecha para las acciones (botón Eliminar)
      if (item.user === localStorage.getItem("username")) {
        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("voluntario-actions");
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.innerText = "Eliminar";
        deleteBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          if (confirm("¿Deseas eliminar tu oferta de voluntariado?")) {
            database.ref("voluntarios/" + item.firebaseKey).remove();
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
      const vol = voluntarioItems.find(v => v.firebaseKey === id);
      if (vol) {
        showVoluntarioDetail(vol);
      }
    }
  });
  function showVoluntarioDetail(vol) {
    voluntarioListView.style.display = "none";
    voluntarioCreateForm.style.display = "none";
    const voluntarioDetailDiv = document.getElementById("voluntario-detail");
    voluntarioDetailDiv.innerHTML = "";
    const infoHeader = document.createElement("h3");
    infoHeader.innerText = "Detalle del Voluntario";
    voluntarioDetailDiv.appendChild(infoHeader);
    const horarioP = document.createElement("p");
    horarioP.innerText = "Horario: " + vol.horarioTexto;
    voluntarioDetailDiv.appendChild(horarioP);
    const userP = document.createElement("p");
    userP.innerText = "Ofrecido por: " + vol.user;
    voluntarioDetailDiv.appendChild(userP);
    const profileDiv = document.createElement("div");
    profileDiv.id = "voluntario-profile-info";
    profileDiv.innerHTML =
      "<p>Nombre: " + (localStorage.getItem("profileNombre") || "No definido") + "</p>" +
      "<p>Apellido: " + (localStorage.getItem("profileApellido") || "No definido") + "</p>" +
      "<p>Fecha de Nacimiento: " + (localStorage.getItem("profileDob") || "No definida") + "</p>" +
      "<p>Formación Profesional: " + (localStorage.getItem("profileFormation") || "No definida") + "</p>";
    
    const attachmentsSection = document.createElement("div");
    attachmentsSection.innerHTML = "<h4>Archivos Adjuntos Públicos:</h4>";
    profileAttachments.forEach(function (att) {
      if (att.visibility === "public") {
        const attDiv = document.createElement("div");
        attDiv.className = "attachment-item";
        attDiv.innerHTML = "<strong>" + att.title + "</strong> (" + att.fileName + ")";
        const viewBtn = document.createElement("button");
        viewBtn.className = "view-att-btn";
        viewBtn.innerText = "Visualizar";
        viewBtn.addEventListener("click", function () {
          openModal(att.fileUrl, att.fileName);
        });
        attDiv.appendChild(viewBtn);
        attachmentsSection.appendChild(attDiv);
      }
    });
    profileDiv.appendChild(attachmentsSection);
    voluntarioDetailDiv.appendChild(profileDiv);

    // Chat privado
    const privateChatDiv = document.createElement("div");
    privateChatDiv.id = "voluntario-private-chat";
    privateChatDiv.innerHTML =
      "<h3>Chat Privado con " + vol.user + "</h3>" +
      "<div class='chat-messages' id='voluntario-private-chat-messages'></div>" +
      "<form id='voluntario-private-chat-form'><input type='text' id='voluntario-private-chat-input' placeholder='Escribe tu mensaje' required /><button type='submit' class='enhanced-btn'>Enviar</button></form>";
    voluntarioDetailDiv.appendChild(privateChatDiv);

    const currentUser = localStorage.getItem("username") || "Tú";
    const chatKey = [currentUser, vol.user].sort().join("_");
    const privateChatMessagesDiv = document.getElementById("voluntario-private-chat-messages");
    privateChatMessagesDiv.innerHTML = "";
    const privateChatRef = database.ref("private_chat/" + chatKey);
    privateChatRef.off();
    privateChatRef.on("child_added", function (snapshot) {
      const msg = snapshot.val();
      renderChatMessage(msg, privateChatMessagesDiv);
    });
    const privateChatForm = document.getElementById("voluntario-private-chat-form");
    privateChatForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const chatInput = document.getElementById("voluntario-private-chat-input");
      const message = chatInput.value.trim();
      if (message !== "") {
        privateChatRef.push({ user: currentUser, text: message, timestamp: Date.now() });
        chatInput.value = "";
      }
    });
    currentVoluntario = vol;
    voluntarioDetailView.style.display = "block";
  }
  document.getElementById("volver-voluntario-list").addEventListener("click", function () {
    voluntarioDetailView.style.display = "none";
    voluntarioListView.style.display = "block";
  });

  /* MÓDULO: Mi Perfil */
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
  document.getElementById("profile-attachment-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const attTitle = document.getElementById("attachment-title").value.trim();
    const fileInput = document.getElementById("attachment-file");
    const visibility = document.getElementById("attachment-visibility").value;
    if (attTitle && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = function (ev) {
        const newAttachment = {
          title: attTitle,
          fileName: file.name,
          fileUrl: ev.target.result,
          visibility: visibility
        };
        profileAttachments.push(newAttachment);
        localStorage.setItem("profileAttachments", JSON.stringify(profileAttachments));
        updateAttachmentList();
        alert("Archivo adjuntado");
      };
      reader.readAsDataURL(file);
    }
    this.reset();
  });
  document.getElementById("profile-foto-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const photoInput = document.getElementById("profile-new-photo");
    if (photoInput.files && photoInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function (ev) {
        localStorage.setItem("profilePhoto", ev.target.result);
        document.querySelector(".profile-img").src = ev.target.result;
        updateProfileView();
        alert("Foto actualizada");
      };
      reader.readAsDataURL(photoInput.files[0]);
    }
  });

  function updateAttachmentList() {
    const listContainer = document.getElementById("profile-attachment-list");
    listContainer.innerHTML = "";
    profileAttachments.forEach((att, index) => {
      const attDiv = document.createElement("div");
      attDiv.className = "attachment-item";
      attDiv.setAttribute("data-index", index);
      attDiv.setAttribute("data-visibility", att.visibility);
      attDiv.setAttribute("data-file-url", att.fileUrl);
      attDiv.innerHTML = "<strong>" + att.title + "</strong> (" + att.fileName + ") - " + (att.visibility === "public" ? "Público" : "Privado");
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "toggle-visibility-btn";
      toggleBtn.innerText = (att.visibility === "public") ? "Cambiar a Privado" : "Cambiar a Público";
      toggleBtn.addEventListener("click", function () {
        att.visibility = (att.visibility === "public") ? "private" : "public";
        localStorage.setItem("profileAttachments", JSON.stringify(profileAttachments));
        updateAttachmentList();
      });
      attDiv.appendChild(toggleBtn);
      const viewBtn = document.createElement("button");
      viewBtn.className = "view-att-btn";
      viewBtn.innerText = "Visualizar";
      viewBtn.addEventListener("click", function () {
        openModal(att.fileUrl, att.fileName);
      });
      attDiv.appendChild(viewBtn);
      listContainer.appendChild(attDiv);
    });
  }
});

/* Función para abrir modal en pantalla completa para visualizar archivos */
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

  // Botón visible de cierre
  const closeBtn = document.createElement("span");
  closeBtn.className = "close";
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", function () {
    modal.style.display = "none";
  });
  modalContent.appendChild(closeBtn);

  // Agregar contenido de vista previa
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "image") {
    const img = document.createElement("img");
    img.src = url;
    modalContent.appendChild(img);
    // Cerrar modal al hacer clic en la imagen
    img.addEventListener("click", function () {
      modal.style.display = "none";
    });
  } else if (ext === "pdf") {
    const iframe = document.createElement("iframe");
    iframe.src = url;
    modalContent.appendChild(iframe);
  } else {
    const msg = document.createElement("p");
    msg.textContent = "Vista previa no disponible para este tipo de archivo.";
    modalContent.appendChild(msg);
  }
  // Cerrar modal al hacer clic fuera del contenido
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
  modal.style.display = "block";
}

/* Nota: Los registros de Ayuda y Voluntariado ya incluyen coordenadas usando currentLocationMarker */