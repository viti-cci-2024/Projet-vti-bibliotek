// Variables globales
const showBooksButton = document.getElementById("show-books");
const booksListDiv = document.getElementById("books-list");
const searchAuthorInput = document.getElementById("search-author");
const searchAuthorButton = document.getElementById("search-author-btn");
const searchTitleInput = document.getElementById("search-title");
const searchTitleButton = document.getElementById("search-title-btn");
const searchResultsDiv = document.getElementById("search-results");

// Initialisation d'IndexedDB
const initializeIndexedDB = async () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("Bibliotheque", 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains("books")) {
                db.createObjectStore("books", { keyPath: "titre" });
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
    console.log("Chargement des livres depuis books.json...");
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

// Vérifier si des livres sont déjà chargés
const checkBooksLoaded = async (db) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("books", "readonly");
        const booksStore = transaction.objectStore("books");
        const countRequest = booksStore.count();

        countRequest.onsuccess = () => resolve(countRequest.result > 0);
        countRequest.onerror = () => reject(countRequest.error);
    });
};

// Récupération des livres depuis IndexedDB
const getAllBooks = async (db) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("books", "readonly");
        const booksStore = transaction.objectStore("books");

        const request = booksStore.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error("Erreur lors de la récupération des livres :", request.error);
            reject(request.error);
        };
    });
};

// Recherche de livres par champ
const searchBooks = async (db, field, query) => {
    const books = await getAllBooks(db);
    return books.filter((book) => book[field].toLowerCase().includes(query.toLowerCase()));
};

// Affichage des résultats de recherche
const displaySearchResults = (results, container) => {
    // Masquer la liste complète
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
            <td>${book.etat}</td>
        `;
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
};

// Affichage des livres
const displayBooks = async (db, container) => {
    searchResultsDiv.innerHTML = ""; // Effacer les résultats de recherche
    container.style.display = "block"; // Afficher la liste complète

    const books = await getAllBooks(db);
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
            <td>${book.etat}</td>
        `;
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
};

// Initialisation complète
(async () => {
    const db = await initializeIndexedDB();

    const booksLoaded = await checkBooksLoaded(db);
    if (!booksLoaded) {
        await loadInitialBooks(db);
    } else {
        console.log("Les livres sont déjà chargés dans IndexedDB.");
    }

    // Gestion des événements
    showBooksButton.addEventListener("click", () => displayBooks(db, booksListDiv));

    searchAuthorButton.addEventListener("click", async () => {
        const query = searchAuthorInput.value.trim();
        if (!query) {
            searchResultsDiv.innerHTML = "<p>Veuillez entrer un auteur pour rechercher.</p>";
            return;
        }
        const results = await searchBooks(db, "auteur", query);
        displaySearchResults(results, searchResultsDiv);
    });

    searchTitleButton.addEventListener("click", async () => {
        const query = searchTitleInput.value.trim();
        if (!query) {
            searchResultsDiv.innerHTML = "<p>Veuillez entrer un titre pour rechercher.</p>";
            return;
        }
        const results = await searchBooks(db, "titre", query);
        displaySearchResults(results, searchResultsDiv);
    });
})();
