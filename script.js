// Variables globales
const showBooksButton = document.getElementById("show-books");
const booksListDiv = document.getElementById("books-list");
const searchAuthorInput = document.getElementById("search-author");
const searchAuthorButton = document.getElementById("search-author-btn");
const searchTitleInput = document.getElementById("search-title");
const searchTitleButton = document.getElementById("search-title-btn");
const searchResultsDiv = document.getElementById("search-results");
const authButton = document.getElementById("auth-button");
const authModal = document.getElementById("auth-modal");
const closeModalButton = document.getElementById("close-modal");
const loginButton = document.getElementById("login-button");
const authErrorDiv = document.getElementById("auth-error");
const userStatusSpan = document.getElementById("user-status");

// Initialisation d'IndexedDB
const initializeIndexedDB = async () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("Bibliotheque", 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains("books")) {
                db.createObjectStore("books", { keyPath: "titre" });
            }
            if (!db.objectStoreNames.contains("members")) {
                db.createObjectStore("members", { keyPath: "id" });
            }
        };

        request.onsuccess = () => {
            console.log("Base IndexedDB initialisée.");
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error("Erreur lors de l'initialisation d'IndexedDB :", event.target.error);
            reject(event.target.error);
        };
    });
};

// Chargement initial des livres dans IndexedDB
const loadInitialBooks = async (db) => {
    try {
        const response = await fetch("books.json");
        const booksData = await response.json();

        const transaction = db.transaction("books", "readwrite");
        const booksStore = transaction.objectStore("books");

        booksData.forEach((book) => {
            booksStore.put(book);
        });

        await transaction.complete;
        console.log("Livres chargés avec succès.");
    } catch (error) {
        console.error("Erreur lors du chargement des livres :", error);
    }
};

// Chargement initial des membres dans IndexedDB
const loadInitialMembers = async (db) => {
    try {
        const response = await fetch("membres.json");
        const membersData = await response.json();

        const transaction = db.transaction("members", "readwrite");
        const membersStore = transaction.objectStore("members");

        membersData.forEach((member) => {
            membersStore.put(member);
        });

        await transaction.complete;
        console.log("Membres chargés avec succès.");
    } catch (error) {
        console.error("Erreur lors du chargement des membres :", error);
    }
};

// Vérification si des données sont déjà chargées
const checkDataLoaded = async (db, storeName) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const countRequest = store.count();

        countRequest.onsuccess = () => resolve(countRequest.result > 0);
        countRequest.onerror = () => reject(countRequest.error);
    });
};

// Récupération des données depuis IndexedDB
const getAllData = async (db, storeName) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);

        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Recherche de données par champ
const searchData = async (db, storeName, field, query) => {
    const data = await getAllData(db, storeName);
    return data.filter((item) => item[field].toLowerCase().includes(query.toLowerCase()));
};

// Affichage des résultats de recherche
const displaySearchResults = (results, container) => {
    booksListDiv.style.display = "none";

    container.innerHTML = "";

    if (results.length === 0) {
        container.innerHTML = "<p>Aucun résultat trouvé.</p>";
        return;
    }

    const table = document.createElement("table");
    table.innerHTML = `
        <thead>
            <tr>
                <th>Titre</th>
                <th>Auteur</th>
                <th>État</th>
            </tr>
        </thead>
    `;
    const tbody = document.createElement("tbody");

    results.forEach((book) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${book.titre}</td>
            <td>${book.auteur}</td>
            <td class="${book.etat === "Disponible" ? "disponible" : "emprunte"}">
                ${book.etat}
            </td>
        `;
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
};

// Affichage des livres
const displayBooks = async (db, container) => {
    try {
        searchResultsDiv.innerHTML = "";
        container.style.display = "block";

        const books = await getAllData(db, "books");
        container.innerHTML = "";

        if (books.length === 0) {
            container.innerHTML = "<p>Aucun livre disponible.</p>";
            return;
        }

        const table = document.createElement("table");
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Titre</th>
                    <th>Auteur</th>
                    <th>État</th>
                </tr>
            </thead>
        `;
        const tbody = document.createElement("tbody");

        books.forEach((book) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${book.titre}</td>
                <td>${book.auteur}</td>
                <td class="${book.etat === "Disponible" ? "disponible" : "emprunte"}">
                    ${book.etat}
                </td>
            `;
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        container.appendChild(table);
    } catch (error) {
        console.error("Erreur lors de l'affichage des livres :", error);
        container.innerHTML = "<p>Erreur lors de la récupération des livres.</p>";
    }
};

// Gestion de la modale de connexion
authButton.addEventListener("click", () => {
    authModal.style.display = "flex";
    authErrorDiv.textContent = "";
});

closeModalButton.addEventListener("click", () => {
    authModal.style.display = "none";
});

loginButton.addEventListener("click", async () => {
    const name = document.getElementById("auth-name").value.trim();
    const firstname = document.getElementById("auth-firstname").value.trim();
    const password = document.getElementById("auth-password").value;

    if (!name || !firstname || !password) {
        authErrorDiv.textContent = "Veuillez remplir tous les champs.";
        return;
    }

    try {
        const db = await initializeIndexedDB();
        const members = await getAllData(db, "members");

        const user = members.find(
            (member) =>
                member.nom.toLowerCase() === name.toLowerCase() &&
                member.prenom.toLowerCase() === firstname.toLowerCase() &&
                member.motDePasse === password
        );

        if (user) {
            userStatusSpan.textContent = `Statut : Connecté (${user.statut})`;
            userStatusSpan.classList.add("connected");
            authModal.style.display = "none";
        } else {
            authErrorDiv.textContent = "Identifiants incorrects.";
        }
    } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        authErrorDiv.textContent = "Une erreur est survenue. Veuillez réessayer.";
    }
});

// Initialisation complète
(async () => {
    const db = await initializeIndexedDB();

    const booksLoaded = await checkDataLoaded(db, "books");
    if (!booksLoaded) {
        await loadInitialBooks(db);
    } else {
        console.log("Les livres sont déjà chargés dans IndexedDB.");
    }

    const membersLoaded = await checkDataLoaded(db, "members");
    if (!membersLoaded) {
        await loadInitialMembers(db);
    } else {
        console.log("Les membres sont déjà chargés dans IndexedDB.");
    }

    // Gestion des événements
    showBooksButton.addEventListener("click", () => displayBooks(db, booksListDiv));

    searchAuthorButton.addEventListener("click", async () => {
        const query = searchAuthorInput.value.trim();
        if (!query) {
            searchResultsDiv.innerHTML = "<p>Veuillez entrer un auteur pour rechercher.</p>";
            return;
        }
        const results = await searchData(db, "books", "auteur", query);
        displaySearchResults(results, searchResultsDiv);
    });

    searchTitleButton.addEventListener("click", async () => {
        const query = searchTitleInput.value.trim();
        if (!query) {
            searchResultsDiv.innerHTML = "<p>Veuillez entrer un titre pour rechercher.</p>";
            return;
        }
        const results = await searchData(db, "books", "titre", query);
        displaySearchResults(results, searchResultsDiv);
    });
})();
