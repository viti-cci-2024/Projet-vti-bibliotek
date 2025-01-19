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

let books = [];

// Mise à jour du statut utilisateur
const updateUserStatus = () => {
    const user = JSON.parse(localStorage.getItem("connectedUser"));
    if (user) {
        userStatus.textContent = `${user.nom} ${user.prenom} - ${user.statut} - Statut : Connecté`;
        userStatus.classList.add("connected");
        authButton.textContent = "Se déconnecter";
    } else {
        userStatus.textContent = "Statut : Non connecté";
        userStatus.classList.remove("connected");
        authButton.textContent = "Connexion";
    }
};

// Fonction pour afficher les livres dans un tableau
const displayBooks = (booksToDisplay, container) => {
    container.innerHTML = ""; // Efface le contenu précédent
    if (booksToDisplay.length === 0) {
        container.innerHTML = "<p>Aucun résultat trouvé.</p>";
        return;
    }

    const table = document.createElement("table");

    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th>Titre</th>
            <th>Auteur</th>
            <th>État</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    booksToDisplay.forEach(book => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${book.titre}</td>
            <td>${book.auteur}</td>
            <td class="${book.etat === "Disponible" ? "disponible" : "emprunte"}">${book.etat}</td>
        `;
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

        // Efface les tableaux de résultats avant d'afficher la liste complète
        searchResultsDiv.innerHTML = "";
        displayBooks(books, booksListDiv);
    } catch (error) {
        console.error("Erreur lors du chargement des livres :", error);
    }
};

// Fonction pour rechercher par auteur
const searchByAuthor = () => {
    const query = searchAuthorInput.value.trim().toLowerCase();
    booksListDiv.innerHTML = ""; // Efface la liste des livres affichés
    searchResultsDiv.innerHTML = ""; // Efface les résultats précédents

    const results = books.filter(book => book.auteur.toLowerCase().includes(query));
    displayBooks(results, searchResultsDiv);
};

// Fonction pour rechercher par titre
const searchByTitle = () => {
    const query = searchTitleInput.value.trim().toLowerCase();
    booksListDiv.innerHTML = ""; // Efface la liste des livres affichés
    searchResultsDiv.innerHTML = ""; // Efface les résultats précédents

    const results = books.filter(book => book.titre.toLowerCase().includes(query));
    displayBooks(results, searchResultsDiv);
};

// Fonction pour effacer tout
const clearDisplay = () => {
    booksListDiv.innerHTML = "";
    searchResultsDiv.innerHTML = "";
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

    // Efface les résultats de recherche et la liste après déconnexion
    clearDisplay();
};

// Ouverture/fermeture de la modale
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

// Événements
showBooksButton.addEventListener("click", fetchBooks);
clearBooksButton.addEventListener("click", clearDisplay);
searchAuthorButton.addEventListener("click", searchByAuthor);
searchTitleButton.addEventListener("click", searchByTitle);

// Initialisation
updateUserStatus();
