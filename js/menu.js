import { db } from "./firebase-config.js";
import { collection, getDocs } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const menuContainer = document.getElementById("menu-container");

async function loadMenu() {
  const querySnapshot = await getDocs(collection(db, "menu"));

  querySnapshot.forEach(doc => {
    const item = doc.data();

    const card = document.createElement("div");
    card.className = "menu-card";
    card.innerHTML = `
      <img src="${item.image}">
      <h3>${item.name}</h3>
      <p>$${item.price}</p>
    `;

    menuContainer.appendChild(card);
  });
}

loadMenu();
