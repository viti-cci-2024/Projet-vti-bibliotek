// V3 - ajout suppression de livre
// Variables globales
const showBooksButton = document.getElementById("show-books");
const clearBooksButton = document.getElementById("clear-books");
const booksListDiv = document.getElementById("books-list");
const addBookSection = document.getElementById("add-book-section");
const addBookButton = document.getElementById("add-book-button");
const bookTitleInput = document.getElementById("book-title");
const bookAuthorInput = document.getElementById("book-author");
const userStatus = document.getElementById("user-status");
const authButton = document.getElementById("auth-button");
const authModal = document.getElementById("auth-modal");
const closeModalButton = document.getElementById("close-modal");
const loginButton = document.getElementById("login-button");
const authError = document.getElementById("auth-error");
const searchAuthorInput = document.getElementById("search-author");
const searchAuthorButton = document.getElementById("search-author-btn");
const searchTitleInput = document.getElementById("search-title");
const searchTitleButton = document.getElementById("search-title-btn");
const searchResultsDiv = document.getElementById("search-results");

let books = [];

// Fonction pour mettre à jour le statut de connexion
const updateUserStatus = () => {
    const user = JSON.parse(localStorage.getItem("connectedUser"));
    if (user) {
        userStatus.textContent = `${user.nom} ${user.prenom} - ${user.statut} - Statut : Connecté`;
        userStatus.classList.add("connected");
        authButton.textContent = "Se déconnecter";
        addBookSection.style.display = "block";
    } else {
        userStatus.textContent = "Statut : Non connecté";
        userStatus.classList.remove("connected");
        authButton.textContent = "Connexion";
        addBookSection.style.display = "none";
    }
};

// Fonction pour ouvrir ou fermer la modale
const toggleAuthModal = () => {
    authModal.style.display = authModal.style.display === "flex" ? "none" : "flex";
    authError.textContent = "";
};

// Fonction pour gérer la connexion
const login = async () => {
    const name = document.getElementById("auth-name").value.trim();
    const firstname = document.getElementById("auth-firstname").value.trim();
    const password = document.getElementById("auth-password").value;

    if (!name || !firstname || !password) {
        authError.textContent = "Tous les champs sont obligatoires.";
        return;
    }

    try {
        const response = await fetch("membres.json");
        if (!response.ok) throw new Error("Impossible de charger les données.");
        const membres = await response.json();

        const user = membres.find(
            m =>
                m.nom.toLowerCase() === name.toLowerCase() &&
                m.prenom.toLowerCase() === firstname.toLowerCase() &&
                m.motDePasse === password
        );

        if (user) {
            localStorage.setItem("connectedUser", JSON.stringify(user));
            toggleAuthModal();
            updateUserStatus();
        } else {
            authError.textContent = "Identifiants incorrects.";
        }
    } catch (error) {
        authError.textContent = `Erreur : ${error.message}`;
    }
};

// Fonction pour gérer la déconnexion
const logout = () => {
    localStorage.removeItem("connectedUser");
    updateUserStatus();
};

// Fonction pour afficher les livres dans un tableau
const displayBooks = (booksToDisplay, container) => {
    container.innerHTML = "";
    const table = document.createElement("table");

    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th>Titre</th>
            <th>Auteur</th>
            <th>État</th>
            <th>Action</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    booksToDisplay.forEach((book, index) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${book.titre}</td>
            <td>${book.auteur}</td>
            <td class="${book.etat === "Disponible" ? "disponible" : "emprunte"}">${book.etat}</td>
        `;

        const actionTd = document.createElement("td");
        const user = JSON.parse(localStorage.getItem("connectedUser"));
        if (user) {
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Supprimer";
            deleteButton.addEventListener("click", () => removeBook(index));
            actionTd.appendChild(deleteButton);
        }
        tr.appendChild(actionTd);

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
};

// Fonction pour récupérer les livres
const fetchBooks = async () => {
    try {
        const response = await fetch("books.json");
        books = await response.json();
        displayBooks(books, booksListDiv);
    } catch (error) {
        console.error("Erreur lors du chargement des livres :", error);
    }
};

// Fonction pour ajouter un livre
const addBook = () => {
    const titre = bookTitleInput.value.trim();
    const auteur = bookAuthorInput.value.trim();

    if (!titre || !auteur) {
        alert("Tous les champs doivent être remplis.");
        return;
    }

    books.push({ titre, auteur, etat: "Disponible" });
    displayBooks(books, booksListDiv);
    bookTitleInput.value = "";
    bookAuthorInput.value = "";
};

// Fonction pour supprimer un livre
const removeBook = (index) => {
    books.splice(index, 1);
    displayBooks(books, booksListDiv);
};

// Recherche par auteur
const searchByAuthor = () => {
    const query = searchAuthorInput.value.trim().toLowerCase();
    const results = books.filter(book => book.auteur.toLowerCase().includes(query));
    displayBooks(results, searchResultsDiv);
};

// Recherche par titre
const searchByTitle = () => {
    const query = searchTitleInput.value.trim().toLowerCase();
    const results = books.filter(book => book.titre.toLowerCase().includes(query));
    displayBooks(results, searchResultsDiv);
};

// Événements
showBooksButton.addEventListener("click", fetchBooks);
clearBooksButton.addEventListener("click", () => {
    booksListDiv.innerHTML = "";
    searchResultsDiv.innerHTML = "";
});
addBookButton.addEventListener("click", addBook);
authButton.addEventListener("click", () => {
    const isConnected = !!localStorage.getItem("connectedUser");
    if (isConnected) logout();
    else toggleAuthModal();
});
closeModalButton.addEventListener("click", toggleAuthModal);
loginButton.addEventListener("click", login);
searchAuthorButton.addEventListener("click", searchByAuthor);
searchTitleButton.addEventListener("click", searchByTitle);

// Initialisation
updateUserStatus();
