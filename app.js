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
var db = firebase.firestore();

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

/* Función actualizada para renderizar mensajes de chat con bocadillos */
function renderChatMessage(msg, container) {
  const currentUser = localStorage.getItem("username") || "Tú";
  const messageContainer = document.createElement("div");
  messageContainer.classList.add("chat-message");
  if (msg.user === currentUser) {
    messageContainer.classList.add("mine");
  } else {
    messageContainer.classList.add("other");
  }

  const bubble = document.createElement("div");
  bubble.classList.add("chat-bubble");
  if (msg.user === currentUser) {
    bubble.classList.add("mine");
  } else {
    bubble.classList.add("other");
    // Se añade el nombre del usuario solo para mensajes de los demás
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

document.addEventListener("DOMContentLoaded", function () {

  // Mostrar mensaje de bienvenida (prototipo)
  var acceptBtn = document.getElementById("accept-dev-message");
  if (acceptBtn) {
    acceptBtn.addEventListener("click", function () {
      document.getElementById("dev-message").style.display = "none";
    });
  }

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
    document.getElementById("profile-large-photo").src =
      localStorage.getItem("profilePhoto") || "https://via.placeholder.com/100/FFFFFF/000000?text=Perfil";
  }

  /* SLIDERS DE VOLUNTARIOS */
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

  /* BOTÓN DE PANTALLA COMPLETA (compatibilidad móvil) */
  const fullscreenBtn = document.getElementById("fullscreen-btn");
  fullscreenBtn.addEventListener("click", function () {
    const mapContainer = document.getElementById("map-container");
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
      if (mapContainer.requestFullscreen) {
        mapContainer.requestFullscreen().then(() => {
          setTimeout(() => {
            google.maps.event.trigger(map, "resize");
            if (currentLocationMarker) {
              map.setCenter(currentLocationMarker.getPosition());
            }
          }, 1000);
        }).catch(err => {
          console.error(`Error entering fullscreen: ${err.message}`);
        });
      } else if (mapContainer.webkitRequestFullscreen) {
        mapContainer.webkitRequestFullscreen();
        setTimeout(() => {
          google.maps.event.trigger(map, "resize");
          if (currentLocationMarker) {
            map.setCenter(currentLocationMarker.getPosition());
          }
        }, 1000);
      } else if (mapContainer.msRequestFullscreen) {
        mapContainer.msRequestFullscreen();
        setTimeout(() => {
          google.maps.event.trigger(map, "resize");
          if (currentLocationMarker) {
            map.setCenter(currentLocationMarker.getPosition());
          }
        }, 1000);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setTimeout(() => {
            google.maps.event.trigger(map, "resize");
            if (currentLocationMarker) {
              map.setCenter(currentLocationMarker.getPosition());
            }
          }, 600);
        });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
        setTimeout(() => {
          google.maps.event.trigger(map, "resize");
          if (currentLocationMarker) {
            map.setCenter(currentLocationMarker.getPosition());
          }
        }, 600);
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
        setTimeout(() => {
          google.maps.event.trigger(map, "resize");
          if (currentLocationMarker) {
            map.setCenter(currentLocationMarker.getPosition());
          }
        }, 600);
      }
    }
  });

  /* MÓDULO: ORGANIZACIONES */
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
      db.collection("organizaciones").add(newOrg)
        .catch(error => console.error("Error al crear la organización:", error));
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
  // Listener en tiempo real para organizaciones
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
      if (org.admin === localStorage.getItem("username")) {
        const deleteOrgBtn = document.createElement("button");
        deleteOrgBtn.className = "delete-org-btn";
        deleteOrgBtn.innerText = "Eliminar";
        deleteOrgBtn.addEventListener("click", function(e){
          e.stopPropagation();
          if(confirm("¿Estás seguro de que deseas eliminar esta organización?")){
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

    // Mostrar miembros de la organización
    const memberList = document.getElementById("org-member-list");
    memberList.innerHTML = ""; // Limpiar la lista antes de agregar
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

    // Listener para el chat de Organización usando subcolección "messages"
    const orgChatContainer = document.getElementById("org-chat-messages");
    orgChatContainer.innerHTML = "";
    db.collection("org_chat").doc(org.firebaseKey).collection("messages").orderBy("timestamp")
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
  // Botón "Unirse a Organización"
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
      db.collection("organizaciones").doc(currentOrg.firebaseKey).update({ members: currentOrg.members })
        .then(() => { alert("¡Te has unido a la organización!"); })
        .catch(error => { alert("Error al unirse: " + error.message); });
    });
  }
  // Listener para enviar mensajes en el chat de ORGANIZACIONES
  document.getElementById("org-chat-form").onsubmit = function(e) {
    e.preventDefault();
    const input = document.getElementById("org-chat-input");
    const message = input.value.trim();
    if (message !== "" && currentOrg) {
      db.collection("org_chat").doc(currentOrg.firebaseKey).collection("messages").add({
        user: localStorage.getItem("username") || "Tú",
        text: message,
        timestamp: Date.now()
      }).catch(function(error) {
        console.error("Error enviando mensaje en chat de organización:", error);
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
      db.collection("ayuda").add(newAyuda)
        .catch(error => console.error("Error creando punto de ayuda", error));
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
  // Listener en tiempo real para puntos de ayuda
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

    // Si el usuario es el creador, agregar botón para eliminar
    if (localStorage.getItem("username") === ayuda.creator) {
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

    // Chat de Ayuda: subcolección "messages" en "ayuda_chat"
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

    // Mostrar el mapa pequeño
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

  document.getElementById("view-on-map").addEventListener("click", function () {
    showSection("map-view"); // Cambia a la sección del mapa
    const pos = { lat: currentAyuda.latitude, lng: currentAyuda.longitude };
    map.setCenter(pos);
    map.setZoom(15); // Ajusta el zoom según sea necesario
    if (currentLocationMarker) {
      currentLocationMarker.setPosition(pos);
    } else {
      currentLocationMarker = new google.maps.Marker({
        position: pos,
        map: map,
        title: "Punto de Ayuda: " + currentAyuda.titulo,
        icon: helpIcon
      });
    }
  });

  /* MÓDULO: VOLUNTARIOS */
  const voluntarioListView = document.getElementById("voluntario-list-view");
  const voluntarioCreateForm = document.getElementById("voluntario-create-form");
  const voluntarioDetailView = document.getElementById("voluntario-detail-view");
  const voluntarioListContainer = document.getElementById("voluntario-list");

  document.getElementById("mostrar-voluntario-create").addEventListener("click", function () {
    const currentUser = localStorage.getItem("username");
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
    const habilidades = document.getElementById("voluntario-habilidades").value.trim();
    newVoluntario.habilidades = habilidades;

    db.collection("voluntarios").add(newVoluntario)
      .catch(error => console.error("Error creando voluntario:", error));
    this.reset();
    voluntarioCreateForm.style.display = "none";
  });
  // Listener en tiempo real para voluntarios
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
      if (item.user === localStorage.getItem("username")) {
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

    const currentUser = localStorage.getItem("username") || "Tú";
    const chatKey = [currentUser, vol.user].sort().join("_");
    const privateChatMessagesDiv = document.getElementById("voluntario-private-chat-messages");
    privateChatMessagesDiv.innerHTML = "";
    db.collection("voluntario_chat").doc(chatKey).collection("messages").orderBy("timestamp")
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
        db.collection("voluntario_chat").doc(chatKey).collection("messages").add({
          user: currentUser,
          text: message,
          timestamp: Date.now()
        }).catch(error => console.error("Error en chat privado:", error));
        chatInput.value = "";
      }
    };
    currentVoluntario = vol;
    voluntarioDetailView.style.display = "block";
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
      const deleteAttBtn = document.createElement("button");
      deleteAttBtn.className = "delete-att-btn";
      deleteAttBtn.innerText = "Eliminar";
      deleteAttBtn.addEventListener("click", function () {
        profileAttachments.splice(index, 1);
        localStorage.setItem("profileAttachments", JSON.stringify(profileAttachments));
        updateAttachmentList();
      });
      attDiv.appendChild(deleteAttBtn);
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
  const closeBtn = document.createElement("span");
  closeBtn.className = "close";
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", function () {
    modal.style.display = "none";
  });
  modalContent.appendChild(closeBtn);
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "image") {
    const img = document.createElement("img");
    img.src = url;
    modalContent.appendChild(img);
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
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
  modal.style.display = "block";
}
