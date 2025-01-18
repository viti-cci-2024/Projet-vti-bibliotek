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

        if (book.etat === "Disponible") {
            tdEtat.classList.add("disponible");
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
