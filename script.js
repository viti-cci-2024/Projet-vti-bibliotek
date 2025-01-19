// Variables globales
const showBooksButton = document.getElementById("show-books");
const clearBooksButton = document.getElementById("clear-books");
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
const addBookSection = document.getElementById("add-book-section");
const addBookButton = document.getElementById("add-book-button");
const bookTitleInput = document.getElementById("book-title");
const bookAuthorInput = document.getElementById("book-author");

// Variables pour suivre l'utilisateur connecté
let isConnected = false;
let currentUser = { nom: "", prenom: "" };

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

// Mise à jour d'un livre dans IndexedDB
const updateBook = async (db, book) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("books", "readwrite");
        const booksStore = transaction.objectStore("books");

        const request = booksStore.put(book);

        request.onsuccess = () => {
            console.log("Livre mis à jour :", book);
            resolve();
        };

        request.onerror = () => {
            console.error("Erreur lors de la mise à jour du livre :", request.error);
            reject(request.error);
        };
    });
};

// Suppression d'un livre
const deleteBook = async (db, title) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("books", "readwrite");
        const booksStore = transaction.objectStore("books");

        const request = booksStore.delete(title);

        request.onsuccess = () => {
            console.log("Livre supprimé :", title);
            resolve();
        };

        request.onerror = () => {
            console.error("Erreur lors de la suppression du livre :", request.error);
            reject(request.error);
        };
    });
};

// Affichage des résultats de recherche
const displaySearchResults = (results, container) => {
    booksListDiv.style.display = "none"; // Masque la liste complète

    container.innerHTML = ""; // Efface les résultats précédents

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
                ${isConnected ? "<th>Emprunteur</th>" : ""}
                ${isConnected ? "<th>Actions</th>" : ""}
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
            ${
                isConnected
                    ? `<td>${book.emprunteur || "N/A"}</td>`
                    : ""
            }
            ${
                isConnected
                    ? `
                    <td>
                        ${book.etat === "Disponible" ? `<button class="borrow-book" data-title="${book.titre}">Emprunter</button>` : `<button class="return-book" data-title="${book.titre}">Retourner</button>`}
                        <button class="delete-book" data-title="${book.titre}">Supprimer</button>
                    </td>
                    `
                    : ""
            }
        `;
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    if (isConnected) {
        // Gestion des boutons "Emprunter"
        const borrowButtons = document.querySelectorAll(".borrow-book");
        borrowButtons.forEach((button) => {
            button.addEventListener("click", async (event) => {
                const title = event.target.getAttribute("data-title");
                const book = results.find((b) => b.titre === title);

                if (book) {
                    book.etat = "Emprunté";
                    book.emprunteur = `${currentUser.prenom} ${currentUser.nom}`;
                    const db = await initializeIndexedDB();
                    await updateBook(db, book);
                    displaySearchResults(await searchData(db, "books", "titre", ""), container); // Rafraîchit les résultats
                }
            });
        });

        // Gestion des boutons "Retourner"
        const returnButtons = document.querySelectorAll(".return-book");
        returnButtons.forEach((button) => {
            button.addEventListener("click", async (event) => {
                const title = event.target.getAttribute("data-title");
                const book = results.find((b) => b.titre === title);

                if (book) {
                    book.etat = "Disponible";
                    book.emprunteur = null;
                    const db = await initializeIndexedDB();
                    await updateBook(db, book);
                    displaySearchResults(await searchData(db, "books", "titre", ""), container); // Rafraîchit les résultats
                }
            });
        });

        // Gestion des boutons "Supprimer"
        const deleteButtons = document.querySelectorAll(".delete-book");
        deleteButtons.forEach((button) => {
            button.addEventListener("click", async (event) => {
                const title = event.target.getAttribute("data-title");
                const db = await initializeIndexedDB();
                await deleteBook(db, title);
                displaySearchResults(await searchData(db, "books", "titre", ""), container); // Rafraîchit les résultats
            });
        });
    }
};

// Affichage des livres
const displayBooks = async (db, container) => {
    try {
        searchResultsDiv.innerHTML = ""; // Efface les résultats de recherche
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
                    ${isConnected ? "<th>Emprunteur</th>" : ""}
                    ${isConnected ? "<th>Actions</th>" : ""}
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
                ${
                    isConnected
                        ? `<td>${book.emprunteur || "N/A"}</td>`
                        : ""
                }
                ${
                    isConnected
                        ? `
                    <td>
                        ${book.etat === "Disponible" ? `<button class="borrow-book" data-title="${book.titre}">Emprunter</button>` : `<button class="return-book" data-title="${book.titre}">Retourner</button>`}
                        <button class="delete-book" data-title="${book.titre}">Supprimer</button>
                    </td>
                    `
                        : ""
                }
            `;
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        container.appendChild(table);

        if (isConnected) {
            // Gestion des boutons "Emprunter"
            const borrowButtons = document.querySelectorAll(".borrow-book");
            borrowButtons.forEach((button) => {
                button.addEventListener("click", async (event) => {
                    const title = event.target.getAttribute("data-title");
                    const book = books.find((b) => b.titre === title);

                    if (book) {
                        book.etat = "Emprunté";
                        book.emprunteur = `${currentUser.prenom} ${currentUser.nom}`;
                        await updateBook(db, book);
                        await displayBooks(db, container); // Réaffiche les livres
                    }
                });
            });

            // Gestion des boutons "Retourner"
            const returnButtons = document.querySelectorAll(".return-book");
            returnButtons.forEach((button) => {
                button.addEventListener("click", async (event) => {
                    const title = event.target.getAttribute("data-title");
                    const book = books.find((b) => b.titre === title);

                    if (book) {
                        book.etat = "Disponible";
                        book.emprunteur = null;
                        await updateBook(db, book);
                        await displayBooks(db, container); // Réaffiche les livres
                    }
                });
            });

            // Gestion des boutons "Supprimer"
            const deleteButtons = document.querySelectorAll(".delete-book");
            deleteButtons.forEach((button) => {
                button.addEventListener("click", async (event) => {
                    const title = event.target.getAttribute("data-title");
                    await deleteBook(db, title);
                    await displayBooks(db, container); // Réaffiche les livres
                });
            });
        }
    } catch (error) {
        console.error("Erreur lors de l'affichage des livres :", error);
        container.innerHTML = "<p>Erreur lors de la récupération des livres.</p>";
    }
};

// Gestion du bouton "Ajouter un livre"
addBookButton.addEventListener("click", async () => {
    const title = bookTitleInput.value.trim();
    const author = bookAuthorInput.value.trim();

    if (!title || !author) {
        console.error("Titre et auteur sont obligatoires.");
        return;
    }

    try {
        const db = await initializeIndexedDB();
        await addBook(db, title, author);
        bookTitleInput.value = "";
        bookAuthorInput.value = "";
        await displayBooks(db, booksListDiv); // Réaffiche les livres
    } catch (error) {
        console.error("Erreur lors de l'ajout du livre :", error);
    }
});

// Effacer la liste des livres
clearBooksButton.addEventListener("click", () => {
    booksListDiv.innerHTML = ""; // Efface le contenu
    booksListDiv.style.display = "none"; // Masque la liste si nécessaire
    console.log("Liste des livres effacée.");
});

// Recherche par auteur
searchAuthorButton.addEventListener("click", async () => {
    const query = searchAuthorInput.value.trim();
    if (!query) {
        searchResultsDiv.innerHTML = "<p>Veuillez entrer un auteur pour rechercher.</p>";
        return;
    }

    try {
        const db = await initializeIndexedDB();
        const results = await searchData(db, "books", "auteur", query);
        displaySearchResults(results, searchResultsDiv);
    } catch (error) {
        console.error("Erreur lors de la recherche par auteur :", error);
        searchResultsDiv.innerHTML = "<p>Erreur lors de la recherche. Veuillez réessayer.</p>";
    }
});

// Recherche par titre
searchTitleButton.addEventListener("click", async () => {
    const query = searchTitleInput.value.trim();
    if (!query) {
        searchResultsDiv.innerHTML = "<p>Veuillez entrer un titre pour rechercher.</p>";
        return;
    }

    try {
        const db = await initializeIndexedDB();
        const results = await searchData(db, "books", "titre", query);
        displaySearchResults(results, searchResultsDiv);
    } catch (error) {
        console.error("Erreur lors de la recherche par titre :", error);
        searchResultsDiv.innerHTML = "<p>Erreur lors de la recherche. Veuillez réessayer.</p>";
    }
});

// Gestion dela modale de connexion
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
            isConnected = true;
            currentUser = { nom: user.nom, prenom: user.prenom };
            userStatusSpan.textContent = `Statut : Connecté (${user.statut})`;
            userStatusSpan.classList.add("connected");
            addBookSection.style.display = "block"; // Affiche la section d'ajout
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

    // Cache les fonctionnalités d'ajout au démarrage
    addBookSection.style.display = "none";
})();
