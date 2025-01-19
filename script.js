// script.js

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

// **Nouveau : Référence au Bouton "Gestion des Membres"**
const membersButton = document.getElementById("members-button");

// Variables pour suivre l'utilisateur connecté
let isConnected = false;
let currentUser = { nom: "", prenom: "", statut: "" };

// Variables pour la modification de livre
const editModal = document.getElementById("edit-modal");
const closeEditModalButton = document.getElementById("close-edit-modal");
const validateEditButton = document.getElementById("validate-edit-button");
const editTitleInput = document.getElementById("edit-title");
const editAuthorInput = document.getElementById("edit-author");
const editErrorDiv = document.getElementById("edit-error");
let bookToEdit = null; // Objet du livre en cours de modification

/**
 * =========================
 * 1. Initialisation IndexedDB
 * =========================
 */
const initializeIndexedDB = async () => {
    return new Promise((resolve, reject) => {
        // On passe en version 2 pour forcer onupgradeneeded si la base n’existe pas ou est en version 1
        const request = indexedDB.open("Bibliotheque", 2);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains("books")) {
                db.createObjectStore("books", { keyPath: "titre" });
            }

            // Harmonisation : store members avec autoIncrement
            if (!db.objectStoreNames.contains("members")) {
                db.createObjectStore("members", { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = () => {
            console.log("Base IndexedDB initialisée (script.js).");
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error("Erreur lors de l'initialisation d'IndexedDB :", event.target.error);
            reject(event.target.error);
        };
    });
};

/**
 * =========================
 * 2. Chargement initial des données dans IndexedDB
 * =========================
 */
const loadInitialBooks = async (db) => {
    try {
        const response = await fetch("books.json");
        const booksData = await response.json();

        const transaction = db.transaction("books", "readwrite");
        const booksStore = transaction.objectStore("books");

        booksData.forEach((book) => {
            booksStore.put(book);
        });

        await new Promise((resolve, reject) => {
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
        });

        console.log("Livres chargés avec succès.");
    } catch (error) {
        console.error("Erreur lors du chargement des livres :", error);
    }
};

const loadInitialMembers = async (db) => {
    try {
        const response = await fetch("membres.json");
        const membersData = await response.json();

        const transaction = db.transaction("members", "readwrite");
        const membersStore = transaction.objectStore("members");

        membersData.forEach((member) => {
            membersStore.put(member);
        });

        await new Promise((resolve, reject) => {
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
        });

        console.log("Membres chargés avec succès.");
    } catch (error) {
        console.error("Erreur lors du chargement des membres :", error);
    }
};

const checkDataLoaded = async (db, storeName) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const countRequest = store.count();

        countRequest.onsuccess = () => resolve(countRequest.result > 0);
        countRequest.onerror = () => reject(countRequest.error);
    });
};

/**
 * =========================
 * 3. Gestion des livres
 * =========================
 */
const getAllData = async (db, storeName) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);

        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const searchData = async (db, storeName, field, query) => {
    const data = await getAllData(db, storeName);
    return data.filter((item) => item[field].toLowerCase().includes(query.toLowerCase()));
};

const updateBook = async (db, oldTitle, updatedBook) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("books", "readwrite");
        const booksStore = transaction.objectStore("books");

        // Si le titre a changé, on supprime l'ancien enregistrement puis on ajoute
        if (oldTitle !== updatedBook.titre) {
            booksStore.delete(oldTitle).onsuccess = () => {
                booksStore.put(updatedBook).onsuccess = () => {
                    console.log("Livre mis à jour :", updatedBook);
                    resolve();
                };
                booksStore.put(updatedBook).onerror = () => {
                    console.error("Erreur lors de la mise à jour du livre :", booksStore.error);
                    reject(booksStore.error);
                };
            };
            booksStore.delete(oldTitle).onerror = () => {
                console.error("Erreur lors de la suppression de l'ancien livre :", booksStore.error);
                reject(booksStore.error);
            };
        } else {
            booksStore.put(updatedBook).onsuccess = () => {
                console.log("Livre mis à jour :", updatedBook);
                resolve();
            };
            booksStore.put(updatedBook).onerror = () => {
                console.error("Erreur lors de la mise à jour du livre :", booksStore.error);
                reject(booksStore.error);
            };
        }
    });
};

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

const addBook = async (db, title, author) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("books", "readwrite");
        const booksStore = transaction.objectStore("books");

        const newBook = {
            titre: title,
            auteur: author,
            etat: "Disponible",
            emprunteur: null
        };

        const request = booksStore.add(newBook);

        request.onsuccess = () => {
            console.log("Livre ajouté :", newBook);
            resolve();
        };

        request.onerror = () => {
            console.error("Erreur lors de l'ajout du livre :", request.error);
            reject(request.error);
        };
    });
};

/**
 * =========================
 * 4. Affichage et interactions
 * =========================
 */
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
                    ${book.etat === "Disponible" 
                        ? `<button class="borrow-book" data-title="${book.titre}">Emprunter</button>`
                        : `<button class="return-book" data-title="${book.titre}">Retourner</button>`}
                    <button class="delete-book" data-title="${book.titre}">Supprimer</button>
                    <button class="edit-book" data-title="${book.titre}">Modifier</button>
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
                    await updateBook(db, book.titre, book);
                    // Recharge l’affichage
                    displaySearchResults(await searchData(db, "books", "titre", ""), container);
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
                    await updateBook(db, book.titre, book);
                    displaySearchResults(await searchData(db, "books", "titre", ""), container);
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
                displaySearchResults(await searchData(db, "books", "titre", ""), container);
            });
        });

        // Gestion des boutons "Modifier"
        const editButtons = document.querySelectorAll(".edit-book");
        editButtons.forEach((button) => {
            button.addEventListener("click", async (event) => {
                const title = event.target.getAttribute("data-title");
                const db = await initializeIndexedDB();
                const books = await getAllData(db, "books");
                const book = books.find((b) => b.titre === title);
                if (book) {
                    bookToEdit = book;
                    editTitleInput.value = book.titre;
                    editAuthorInput.value = book.auteur;
                    editErrorDiv.textContent = "";
                    editModal.style.display = "flex";
                }
            });
        });
    }
};

const displayBooks = async (db, container) => {
    try {
        searchResultsDiv.innerHTML = ""; // Efface les résultats
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
                        ${book.etat === "Disponible" 
                            ? `<button class="borrow-book" data-title="${book.titre}">Emprunter</button>`
                            : `<button class="return-book" data-title="${book.titre}">Retourner</button>`}
                        <button class="delete-book" data-title="${book.titre}">Supprimer</button>
                        <button class="edit-book" data-title="${book.titre}">Modifier</button>
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
            // Boutons "Emprunter"
            const borrowButtons = document.querySelectorAll(".borrow-book");
            borrowButtons.forEach((button) => {
                button.addEventListener("click", async (event) => {
                    const title = event.target.getAttribute("data-title");
                    const book = books.find((b) => b.titre === title);
                    if (book) {
                        book.etat = "Emprunté";
                        book.emprunteur = `${currentUser.prenom} ${currentUser.nom}`;
                        await updateBook(db, book.titre, book);
                        await displayBooks(db, container);
                    }
                });
            });

            // Boutons "Retourner"
            const returnButtons = document.querySelectorAll(".return-book");
            returnButtons.forEach((button) => {
                button.addEventListener("click", async (event) => {
                    const title = event.target.getAttribute("data-title");
                    const book = books.find((b) => b.titre === title);
                    if (book) {
                        book.etat = "Disponible";
                        book.emprunteur = null;
                        await updateBook(db, book.titre, book);
                        await displayBooks(db, container);
                    }
                });
            });

            // Boutons "Supprimer"
            const deleteButtons = document.querySelectorAll(".delete-book");
            deleteButtons.forEach((button) => {
                button.addEventListener("click", async (event) => {
                    const title = event.target.getAttribute("data-title");
                    await deleteBook(db, title);
                    await displayBooks(db, container);
                });
            });

            // Boutons "Modifier"
            const editButtons = document.querySelectorAll(".edit-book");
            editButtons.forEach((button) => {
                button.addEventListener("click", async (event) => {
                    const title = event.target.getAttribute("data-title");
                    const db = await initializeIndexedDB();
                    const books = await getAllData(db, "books");
                    const book = books.find((b) => b.titre === title);
                    if (book) {
                        bookToEdit = book;
                        editTitleInput.value = book.titre;
                        editAuthorInput.value = book.auteur;
                        editErrorDiv.textContent = "";
                        editModal.style.display = "flex";
                    }
                });
            });
        }
    } catch (error) {
        console.error("Erreur lors de l'affichage des livres :", error);
        container.innerHTML = "<p>Erreur lors de la récupération des livres.</p>";
    }
};

/**
 * =========================
 * 5. Gestion de l'ajout de livre
 * =========================
 */
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
        await displayBooks(db, booksListDiv);
    } catch (error) {
        console.error("Erreur lors de l'ajout du livre :", error);
    }
});

/**
 * =========================
 * 6. Gestion du bouton Clear
 * =========================
 */
clearBooksButton.addEventListener("click", () => {
    booksListDiv.innerHTML = ""; 
    booksListDiv.style.display = "none";
    searchResultsDiv.innerHTML = "";
    console.log("Liste des livres effacée.");
});

/**
 * =========================
 * 7. Recherches
 * =========================
 */
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

/**
 * =========================
 * 8. Modale d'authentification
 * =========================
 */
authButton.addEventListener("click", () => {
    if (!isConnected) {
        // Ouvrir la modale de connexion
        authModal.style.display = "flex";
        authErrorDiv.textContent = "";
    } else {
        // Déconnexion
        isConnected = false;
        currentUser = { nom: "", prenom: "", statut: "" };
        localStorage.removeItem("isConnected");
        localStorage.removeItem("currentUser");
        addBookSection.style.display = "none";
        booksListDiv.innerHTML = "";
        searchResultsDiv.innerHTML = "";
        updateAuthButton();
        console.log("Utilisateur déconnecté.");
    }
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
            // Stocke l'info de connexion dans localStorage
            localStorage.setItem("isConnected", "true");
            localStorage.setItem("currentUser", JSON.stringify(user));
            console.log("Utilisateur connecté :", user);

            isConnected = true;
            currentUser = user;
            addBookSection.style.display = "block";
            authModal.style.display = "none";
            updateAuthButton();
        } else {
            authErrorDiv.textContent = "Identifiants incorrects.";
        }
    } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        authErrorDiv.textContent = "Une erreur est survenue. Veuillez réessayer.";
    }
});

/**
 * =========================
 * 9. Modale de modification d'un livre
 * =========================
 */
closeEditModalButton.addEventListener("click", () => {
    editModal.style.display = "none";
});

validateEditButton.addEventListener("click", async () => {
    const newTitle = editTitleInput.value.trim();
    const newAuthor = editAuthorInput.value.trim();

    if (!newTitle || !newAuthor) {
        editErrorDiv.textContent = "Veuillez remplir tous les champs.";
        return;
    }

    try {
        const db = await initializeIndexedDB();

        // Vérifier si un livre avec ce nouveau titre existe déjà
        if (newTitle !== bookToEdit.titre) {
            const existingBook = await new Promise((resolve, reject) => {
                const transaction = db.transaction("books", "readonly");
                const booksStore = transaction.objectStore("books");
                const request = booksStore.get(newTitle);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            if (existingBook) {
                editErrorDiv.textContent = "Un livre avec ce titre existe déjà.";
                return;
            }
        }

        const updatedBook = {
            ...bookToEdit,
            titre: newTitle,
            auteur: newAuthor
        };

        await updateBook(db, bookToEdit.titre, updatedBook);
        editModal.style.display = "none";
        await displayBooks(db, booksListDiv);
    } catch (error) {
        console.error("Erreur lors de la modification du livre :", error);
        editErrorDiv.textContent = "Erreur lors de la modification. Veuillez réessayer.";
    }
});

/**
 * =========================
 * 10. Mise à jour du bouton d'authentification
 * =========================
 */
const updateAuthButton = () => {
    if (isConnected) {
        authButton.textContent = "Déconnexion";
        membersButton.style.display = "inline-block";
        userStatusSpan.textContent = `Statut : Connecté (${currentUser.statut})`;
        userStatusSpan.classList.add("connected");
    } else {
        authButton.textContent = "Connexion";
        membersButton.style.display = "none";
        userStatusSpan.textContent = "Statut : Non connecté";
        userStatusSpan.classList.remove("connected");
    }
};

/**
 * =========================
 * 11. Bouton "Gestion des Membres"
 * =========================
 */
membersButton.addEventListener("click", () => {
    // On ne vide pas localStorage, on fait juste la redirection
    window.location.href = "membres.html";
});

/**
 * =========================
 * 12. Restauration de la connexion via localStorage
 * =========================
 */
document.addEventListener("DOMContentLoaded", async () => {
    // Lire l'état de connexion précédent
    const storedIsConnected = localStorage.getItem("isConnected");
    const storedUser = localStorage.getItem("currentUser");

    if (storedIsConnected === "true" && storedUser) {
        isConnected = true;
        currentUser = JSON.parse(storedUser);
        addBookSection.style.display = "block";
    } else {
        isConnected = false;
        currentUser = { nom: "", prenom: "", statut: "" };
        addBookSection.style.display = "none";
    }
    updateAuthButton();
});

/**
 * =========================
 * 13. Initialisation globale (IIFE)
 * =========================
 */
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

    // Bouton "Afficher les livres"
    showBooksButton.addEventListener("click", () => displayBooks(db, booksListDiv));

    // Au démarrage, on n’affiche pas la liste des livres tant qu’on n’a pas cliqué
    booksListDiv.innerHTML = "";
    booksListDiv.style.display = "none";

    // On laisse l’utilisateur naviguer, les boutons/modes s’adaptent selon isConnected
})();
