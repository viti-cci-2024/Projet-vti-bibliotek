// Variables globales
const authButton = document.getElementById("auth-button");
const authModal = document.getElementById("auth-modal");
const closeModalButton = document.getElementById("close-modal");
const loginButton = document.getElementById("login-button");
const userStatus = document.getElementById("user-status");
const authError = document.getElementById("auth-error");
const showBooksButton = document.getElementById("show-books");
const clearBooksButton = document.getElementById("clear-books");
const booksListDiv = document.getElementById("books-list");
const searchAuthorInput = document.getElementById("search-author");
const searchAuthorButton = document.getElementById("search-author-btn");
const searchTitleInput = document.getElementById("search-title");
const searchTitleButton = document.getElementById("search-title-btn");
const searchResultsDiv = document.getElementById("search-results");
const addBookForm = document.getElementById("add-book-form");
const addBookButton = document.getElementById("add-book-button");
const addBookError = document.getElementById("add-book-error");

let books = [];

// Mise à jour du statut utilisateur
const updateUserStatus = () => {
    const user = JSON.parse(localStorage.getItem("connectedUser"));
    if (user) {
        userStatus.textContent = `${user.nom} ${user.prenom} - ${user.statut} - Statut : Connecté`;
        userStatus.classList.add("connected");
        authButton.textContent = "Se déconnecter";

        // Afficher la section d'ajout de livres uniquement si connecté
        addBookForm.style.display = "block";
    } else {
        userStatus.textContent = "Statut : Non connecté";
        userStatus.classList.remove("connected");
        authButton.textContent = "Connexion";

        // Masquer la section d'ajout de livres si non connecté
        addBookForm.style.display = "none";
    }
};

// Fonction pour afficher les livres
const displayBooks = (booksToDisplay, container) => {
    container.innerHTML = "";
    if (booksToDisplay.length === 0) {
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
                <th>Action</th>
            </tr>
        </thead>
    `;
    const tbody = document.createElement("tbody");
    booksToDisplay.forEach(book => {
        const tr = document.createElement("tr");
        const user = JSON.parse(localStorage.getItem("connectedUser"));
        const deleteButton = user
            ? `<button onclick="deleteBook('${book.titre}')">Supprimer</button>`
            : "";

        tr.innerHTML = `
            <td>${book.titre}</td>
            <td>${book.auteur}</td>
            <td class="${book.etat === "Disponible" ? "disponible" : "emprunte"}">${book.etat}</td>
            <td>${deleteButton}</td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
};

// Fonction pour ajouter un livre
const addBook = () => {
    const title = document.getElementById("book-title").value.trim();
    const author = document.getElementById("book-author").value.trim();

    if (!title || !author) {
        addBookError.textContent = "Veuillez remplir tous les champs.";
        return;
    }

    const user = JSON.parse(localStorage.getItem("connectedUser"));
    if (!user) {
        addBookError.textContent = "Vous devez être connecté pour ajouter un livre.";
        return;
    }

    const newBook = {
        titre: title,
        auteur: author,
        etat: "Disponible"
    };

    books.push(newBook);
    displayBooks(books, booksListDiv);
    addBookError.textContent = "";
    document.getElementById("book-title").value = "";
    document.getElementById("book-author").value = "";
};

addBookButton.addEventListener("click", addBook);

// Fonction pour supprimer un livre
const deleteBook = (title) => {
    const user = JSON.parse(localStorage.getItem("connectedUser"));
    if (!user) {
        alert("Vous devez être connecté pour supprimer un livre.");
        return;
    }

    books = books.filter(book => book.titre !== title);

    // Réaffiche les livres après suppression
    displayBooks(books, booksListDiv);

    const searchQueryAuthor = searchAuthorInput.value.trim().toLowerCase();
    const searchQueryTitle = searchTitleInput.value.trim().toLowerCase();
    if (searchQueryAuthor) searchByAuthor();
    if (searchQueryTitle) searchByTitle();
};

// Recherche par auteur
const searchByAuthor = () => {
    const query = searchAuthorInput.value.trim().toLowerCase();
    booksListDiv.innerHTML = "";
    searchResultsDiv.innerHTML = "";

    const results = books.filter(book => book.auteur.toLowerCase().includes(query));
    displayBooks(results, searchResultsDiv);
};

// Recherche par titre
const searchByTitle = () => {
    const query = searchTitleInput.value.trim().toLowerCase();
    booksListDiv.innerHTML = "";
    searchResultsDiv.innerHTML = "";

    const results = books.filter(book => book.titre.toLowerCase().includes(query));
    displayBooks(results, searchResultsDiv);
};

// Connexion
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
            m => m.nom.toLowerCase() === name.toLowerCase() &&
                 m.prenom.toLowerCase() === firstname.toLowerCase() &&
                 m.motDePasse === password
        );

        if (user) {
            localStorage.setItem("connectedUser", JSON.stringify(user));
            authModal.style.display = "none";
            updateUserStatus();
        } else {
            authError.textContent = "Identifiants incorrects.";
        }
    } catch (error) {
        authError.textContent = `Erreur : ${error.message}`;
    }
};

// Déconnexion
const logout = () => {
    localStorage.removeItem("connectedUser");
    updateUserStatus();
    clearDisplay();
};

// Afficher ou masquer la modale
authButton.addEventListener("click", () => {
    const isConnected = !!localStorage.getItem("connectedUser");
    if (isConnected) logout();
    else authModal.style.display = "flex";
});

closeModalButton.addEventListener("click", () => {
    authModal.style.display = "none";
    authError.textContent = "";
});

loginButton.addEventListener("click", login);

// Initialisation
updateUserStatus();

showBooksButton.addEventListener("click", async () => {
    const response = await fetch("books.json");
    books = await response.json();
    displayBooks(books, booksListDiv);
});

clearBooksButton.addEventListener("click", () => {
    booksListDiv.innerHTML = "";
    searchResultsDiv.innerHTML = "";
});

searchAuthorButton.addEventListener("click", searchByAuthor);
searchTitleButton.addEventListener("click", searchByTitle);
