// Sélection des éléments HTML
const showBooksButton = document.getElementById("show-books");
const clearBooksButton = document.getElementById("clear-books");
const booksListDiv = document.getElementById("books-list");
const searchResultsDiv = document.getElementById("search-results");
const searchAuthorInput = document.getElementById("search-author");
const searchAuthorButton = document.getElementById("search-author-btn");
const searchTitleInput = document.getElementById("search-title");
const searchTitleButton = document.getElementById("search-title-btn");

// Fonction pour vider les zones d'affichage
const clearDisplay = () => {
    booksListDiv.innerHTML = "";
    searchResultsDiv.innerHTML = "";
};

// Fonction pour afficher les livres sous forme de tableau
const displayBooks = (books) => {
    const table = document.createElement("table");

    // Ajoute l'en-tête du tableau
    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th>Titre</th>
            <th>Auteur</th>
            <th>État</th>
        </tr>
    `;
    table.appendChild(thead);

    // Ajoute les lignes du tableau
    const tbody = document.createElement("tbody");
    books.forEach(book => {
        const tr = document.createElement("tr");

        const tdTitre = document.createElement("td");
        tdTitre.textContent = book.titre;

        const tdAuteur = document.createElement("td");
        tdAuteur.textContent = book.auteur;

        const tdEtat = document.createElement("td");
        tdEtat.textContent = book.etat;

        // Ajoute une classe en fonction de l'état
        if (book.etat === "Disponible") {
            tdEtat.classList.add("disponible");
        } else if (book.etat === "Emprunté") {
            tdEtat.classList.add("emprunte");
        }

        tr.appendChild(tdTitre);
        tr.appendChild(tdAuteur);
        tr.appendChild(tdEtat);
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    return table;
};

// Affiche la liste complète des livres
showBooksButton.addEventListener("click", async () => {
    try {
        clearDisplay();
        const response = await fetch("books.json");
        if (!response.ok) throw new Error("Erreur lors du chargement des données.");
        const books = await response.json();
        booksListDiv.appendChild(displayBooks(books));
    } catch (error) {
        booksListDiv.textContent = `Erreur : ${error.message}`;
    }
});

// Efface toutes les zones d'affichage
clearBooksButton.addEventListener("click", clearDisplay);

// Recherche par auteur
searchAuthorButton.addEventListener("click", async () => {
    try {
        clearDisplay();
        const query = searchAuthorInput.value.toLowerCase();
        const response = await fetch("books.json");
        if (!response.ok) throw new Error("Erreur lors du chargement des données.");
        const books = await response.json();

        const filteredBooks = books.filter(book => book.auteur.toLowerCase().includes(query));
        if (filteredBooks.length > 0) {
            searchResultsDiv.appendChild(displayBooks(filteredBooks));
        } else {
            searchResultsDiv.textContent = "Aucun résultat trouvé.";
        }
    } catch (error) {
        searchResultsDiv.textContent = `Erreur : ${error.message}`;
    }
});

// Recherche par titre
searchTitleButton.addEventListener("click", async () => {
    try {
        clearDisplay();
        const query = searchTitleInput.value.toLowerCase();
        const response = await fetch("books.json");
        if (!response.ok) throw new Error("Erreur lors du chargement des données.");
        const books = await response.json();

        const filteredBooks = books.filter(book => book.titre.toLowerCase().includes(query));
        if (filteredBooks.length > 0) {
            searchResultsDiv.appendChild(displayBooks(filteredBooks));
        } else {
            searchResultsDiv.textContent = "Aucun résultat trouvé.";
        }
    } catch (error) {
        searchResultsDiv.textContent = `Erreur : ${error.message}`;
    }
});

// Récupération des éléments HTML
const authButton = document.getElementById("auth-button");
const authModal = document.getElementById("auth-modal");
const closeModalButton = document.getElementById("close-modal");
const loginButton = document.getElementById("login-button");
const userStatus = document.getElementById("user-status");
const authError = document.getElementById("auth-error");

// Vérifie si un utilisateur est connecté
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

// Gestion de la connexion
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
        console.log(membres);

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
};

// Gestion de la modale
authButton.addEventListener("click", () => {
    const isConnected = !!localStorage.getItem("connectedUser");
    if (isConnected) {
        logout();
    } else {
        authModal.style.display = "flex";
    }
});

closeModalButton.addEventListener("click", () => {
    authModal.style.display = "none";
    authError.textContent = "";
});

loginButton.addEventListener("click", login);

// Met à jour le statut à chaque chargement
updateUserStatus();
