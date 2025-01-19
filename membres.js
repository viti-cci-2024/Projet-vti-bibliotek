// membres.js

// Références aux éléments DOM
const membersListDiv = document.getElementById("members-list");
const addMemberButton = document.getElementById("add-member-button");
const memberModal = document.getElementById("member-modal");
const closeMemberModalButton = document.getElementById("close-member-modal");
const saveMemberButton = document.getElementById("save-member-button");
const memberModalTitle = document.getElementById("member-modal-title");
const memberErrorDiv = document.getElementById("member-error");
const memberNomInput = document.getElementById("member-nom");
const memberPrenomInput = document.getElementById("member-prenom");
const memberStatutSelect = document.getElementById("member-statut");
const memberPasswordInput = document.getElementById("member-password");
const homeButton = document.getElementById("home-button");
const authButton = document.getElementById("auth-button");
const userStatusSpan = document.getElementById("user-status");

// Variables pour suivre l'état de la modale
let isEditing = false;
let memberToEdit = null;

// Fonction pour initialiser et accéder à IndexedDB (similaire à script.js)
const initializeIndexedDB = async () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("Bibliotheque", 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains("books")) {
                db.createObjectStore("books", { keyPath: "titre" });
            }
            if (!db.objectStoreNames.contains("members")) {
                db.createObjectStore("members", { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = () => {
            console.log("Base IndexedDB initialisée pour `membres.html`.");
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error("Erreur lors de l'initialisation d'IndexedDB :", event.target.error);
            reject(event.target.error);
        };
    });
};

// Fonction pour récupérer tous les membres
const getAllMembers = async (db) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("members", "readonly");
        const membersStore = transaction.objectStore("members");

        const request = membersStore.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Fonction pour afficher les membres dans une table
const displayMembers = async (db) => {
    try {
        const members = await getAllMembers(db);
        membersListDiv.innerHTML = ""; // Efface la liste existante

        if (members.length === 0) {
            membersListDiv.innerHTML = "<p>Aucun membre enregistré.</p>";
            return;
        }

        const table = document.createElement("table");
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Statut</th>
                    <th>Actions</th>
                </tr>
            </thead>
        `;
        const tbody = document.createElement("tbody");

        members.forEach((member) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${member.id}</td>
                <td>${member.nom}</td>
                <td>${member.prenom}</td>
                <td>${member.statut}</td>
                <td>
                    <button class="edit-member" data-id="${member.id}">Modifier</button>
                    <button class="delete-member" data-id="${member.id}">Supprimer</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        membersListDiv.appendChild(table);

        // Ajouter des gestionnaires d'événements pour les boutons Modifier et Supprimer
        const editButtons = document.querySelectorAll(".edit-member");
        editButtons.forEach((button) => {
            button.addEventListener("click", async (event) => {
                const memberId = parseInt(event.target.getAttribute("data-id"));
                const member = members.find((m) => m.id === memberId);
                if (member) {
                    isEditing = true;
                    memberToEdit = member;
                    memberModalTitle.textContent = "Modifier un Membre";
                    memberNomInput.value = member.nom;
                    memberPrenomInput.value = member.prenom;
                    memberStatutSelect.value = member.statut;
                    memberPasswordInput.value = member.motDePasse || ""; // Si motDePasse n'existe pas
                    memberErrorDiv.textContent = "";
                    memberModal.style.display = "flex";
                }
            });
        });

        const deleteButtons = document.querySelectorAll(".delete-member");
        deleteButtons.forEach((button) => {
            button.addEventListener("click", async (event) => {
                const memberId = parseInt(event.target.getAttribute("data-id"));
                if (confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) {
                    await deleteMember(db, memberId);
                    await displayMembers(db); // Rafraîchit la liste des membres
                }
            });
        });
    } catch (error) {
        console.error("Erreur lors de l'affichage des membres :", error);
        membersListDiv.innerHTML = "<p>Erreur lors de la récupération des membres.</p>";
    }
};

// Fonction pour ajouter ou mettre à jour un membre
const saveMember = async (db) => {
    const nom = memberNomInput.value.trim();
    const prenom = memberPrenomInput.value.trim();
    const statut = memberStatutSelect.value;
    const motDePasse = memberPasswordInput.value.trim();

    if (!nom || !prenom || !statut || !motDePasse) {
        memberErrorDiv.textContent = "Veuillez remplir tous les champs.";
        return;
    }

    try {
        const transaction = db.transaction("members", "readwrite");
        const membersStore = transaction.objectStore("members");

        if (isEditing && memberToEdit) {
            // Mettre à jour le membre existant
            const updatedMember = {
                ...memberToEdit,
                nom,
                prenom,
                statut,
                motDePasse
            };
            membersStore.put(updatedMember);
            console.log("Membre mis à jour :", updatedMember);
        } else {
            // Ajouter un nouveau membre
            const newMember = {
                nom,
                prenom,
                statut,
                motDePasse
            };
            membersStore.add(newMember);
            console.log("Nouveau membre ajouté :", newMember);
        }

        // Attendre la fin de la transaction
        await new Promise((resolve, reject) => {
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
        });

        // Réinitialiser la modale
        isEditing = false;
        memberToEdit = null;
        memberModalTitle.textContent = "Ajouter un Membre";
        memberNomInput.value = "";
        memberPrenomInput.value = "";
        memberStatutSelect.value = "Membre";
        memberPasswordInput.value = "";
        memberErrorDiv.textContent = "";
        memberModal.style.display = "none";

        // Rafraîchir la liste des membres
        await displayMembers(db);
    } catch (error) {
        console.error("Erreur lors de l'enregistrement du membre :", error);
        memberErrorDiv.textContent = "Erreur lors de l'enregistrement. Veuillez réessayer.";
    }
};

// Fonction pour supprimer un membre
const deleteMember = async (db, memberId) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("members", "readwrite");
        const membersStore = transaction.objectStore("members");

        const request = membersStore.delete(memberId);

        request.onsuccess = () => {
            console.log("Membre supprimé :", memberId);
            resolve();
        };

        request.onerror = () => {
            console.error("Erreur lors de la suppression du membre :", request.error);
            reject(request.error);
        };
    });
};

// Gestion de la modale d'ajout/modification de membre
saveMemberButton.addEventListener("click", async () => {
    const db = await initializeIndexedDB();
    await saveMember(db);
});

// Fermeture de la modale
closeMemberModalButton.addEventListener("click", () => {
    isEditing = false;
    memberToEdit = null;
    memberModal.style.display = "none";
});

// Gestion de l'ajout de membre
addMemberButton.addEventListener("click", () => {
    isEditing = false;
    memberToEdit = null;
    memberModalTitle.textContent = "Ajouter un Membre";
    memberNomInput.value = "";
    memberPrenomInput.value = "";
    memberStatutSelect.value = "Membre";
    memberPasswordInput.value = "";
    memberErrorDiv.textContent = "";
    memberModal.style.display = "flex";
});

// Gestion du bouton Retour à l'Accueil
homeButton.addEventListener("click", () => {
    window.location.href = "index.html";
});

// Vérification de l'état de connexion lors du chargement de la page
const checkConnection = async () => {
    // Utilisation de localStorage pour vérifier l'état de connexion
    const storedIsConnected = localStorage.getItem('isConnected') === 'true';
    const storedUser = JSON.parse(localStorage.getItem('currentUser')) || { nom: "", prenom: "", statut: "" };

    if (!storedIsConnected) {
        alert('Vous devez être connecté pour accéder à cette page.');
        window.location.href = 'index.html';
    } else {
        document.getElementById("user-status").textContent = `Statut : Connecté (${storedUser.statut})`;
    }
};

// Initialisation complète
(async () => {
    await checkConnection();
    const db = await initializeIndexedDB();
    await displayMembers(db);
})();
