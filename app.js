const firebaseConfig = {
    apiKey: "AIzaSyBeQtLVt7FBcrHGft_dq_dat7DKb-nwc_w",
    authDomain: "arcanstrum-matrix-game.firebaseapp.com",
    projectId: "arcanstrum-matrix-game",
    //storageBucket: "arcanstrum-matrix-game.firebasestorage.app",
    messagingSenderId: "150541776090",
    appId: "1:150541776090:web:e70a5a2cdf1bd06faa21e3",
    measurementId: "G-FN9MF97DTS"
  };

  // Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Riferimento al database
const database = firebase.database();

console.log('firebase:', firebase);

// Strutture dati
let sessionId = null;
let factions = [];
let currentFaction = null;
let currentTurn = null;
let currentAction = null;


// Riferimenti agli elementi del DOM
const factionsSection = document.getElementById('factions-section');
const factionsContainer = document.getElementById('factions-container');
const addFactionButton = document.getElementById('add-faction-button');
const factionModal = document.getElementById('faction-modal');
const factionForm = document.getElementById('faction-form');
const factionModalTitle = document.getElementById('faction-modal-title');
const closeFactionModalButton = document.getElementById('close-faction-modal');

const turnsSection = document.getElementById('turns-section');
const backToFactionsButton = document.getElementById('back-to-factions-button');
const factionTitle = document.getElementById('faction-title');
const turnsContainer = document.getElementById('turns-container');
const addTurnButton = document.getElementById('add-turn-button');

const actionModal = document.getElementById('action-modal');
const actionForm = document.getElementById('action-form');
const closeActionModalButton = document.getElementById('close-action-modal');

const advDisadvModal = document.getElementById('adv-disadv-modal');
const advantagesList = document.getElementById('advantages-list');
const disadvantagesList = document.getElementById('disadvantages-list');
const advantageInput = document.getElementById('advantage-input');
const addAdvantageButton = document.getElementById('add-advantage-button');
const disadvantageInput = document.getElementById('disadvantage-input');
const addDisadvantageButton = document.getElementById('add-disadvantage-button');
const closeAdvDisadvModalButton = document.getElementById('close-adv-disadv-modal');

// Riferimenti agli elementi del DOM per le sessioni
const sessionsSection = document.getElementById('sessions-section');
const sessionsContainer = document.getElementById('sessions-container');
const createSessionButton = document.getElementById('create-session-button');
const createSessionModal = document.getElementById('create-session-modal');
const createSessionForm = document.getElementById('create-session-form');
const closeCreateSessionModalButton = document.getElementById('close-create-session-modal');

const backToSessionsButton = document.getElementById('back-to-sessions-button');

// Riferimenti agli elementi del DOM per la modale del turno
const turnModal = document.getElementById('turn-modal');
const turnForm = document.getElementById('turn-form');
const turnModalTitle = document.getElementById('turn-modal-title');
const closeTurnModalButton = document.getElementById('close-turn-modal');

closeTurnModalButton.addEventListener('click', () => turnModal.close());
turnForm.addEventListener('submit', saveTurn);

// Funzioni per Scaricare i Dati
const downloadSessionDataButton = document.getElementById('download-session-data-button');
downloadSessionDataButton.addEventListener('click', downloadSessionData);

function downloadSessionData() {
    // Recupera i dati della sessione dal database
    database.ref(`sessions/${sessionId}`).once('value')
        .then(snapshot => {
            const sessionData = snapshot.val();
            // Converti i dati in formato CSV
            const csvData = convertSessionDataToCSV(sessionData);
            // Scarica il file CSV
            downloadCSV(csvData, `session-${sessionId}.csv`);
        })
        .catch(error => {
            console.error('Errore durante il download dei dati della sessione:', error);
            alert('Errore durante il download dei dati della sessione: ' + error.message);
        });
}

function convertSessionDataToCSV(sessionData) {
    let csvContent = 'data:text/csv;charset=utf-8,';

    // Aggiungi l'intestazione
    csvContent += 'Faction Name,Faction Description,Turn Number,Action Type,Result,Method,Resources,Advantages,Disadvantages\n';

    if (sessionData.factions) {
        Object.values(sessionData.factions).forEach(faction => {
            const factionName = faction.name;
            const factionDescription = faction.description;
            if (faction.turns) {
                faction.turns.forEach((turn, turnIndex) => {
                    if (turn.actions) {
                        turn.actions.forEach(action => {
                            const actionType = action.type;
                            const result = action.result;
                            const method = action.method;
                            const resources = action.resources ? action.resources.join(';') : '';
                            const advantages = action.advantages ? action.advantages.join(';') : '';
                            const disadvantages = action.disadvantages ? action.disadvantages.join(';') : '';
                            // Aggiungi la riga al CSV
                            csvContent += `"${factionName}","${factionDescription}",${turnIndex + 1},"${actionType}","${result}","${method}","${resources}","${advantages}","${disadvantages}"\n`;
                        });
                    } else {
                        // Nessuna azione nel turno
                        csvContent += `"${factionName}","${factionDescription}",${turnIndex + 1},,,,,,\n`;
                    }
                });
            } else {
                // Nessun turno per la fazione
                csvContent += `"${factionName}","${factionDescription}",,,,,,,\n`;
            }
        });
    }

    return encodeURI(csvContent);
}

function downloadCSV(csvData, filename) {
    const link = document.createElement('a');
    link.setAttribute('href', csvData);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// Funzione per modificare un turno
function editTurn(event) {
    const turnIndex = event.target.dataset.turnIndex;
    currentTurn = currentFaction.turns[turnIndex];
    document.getElementById('turn-name').value = currentTurn.name || '';
    turnModalTitle.textContent = 'Modifica Turno';
    turnForm.dataset.turnIndex = turnIndex;
    turnModal.showModal();
}

// Funzione per salvare il turno modificato
function saveTurn(event) {
    event.preventDefault();
    const turnIndex = event.target.dataset.turnIndex;
    const name = document.getElementById('turn-name').value;
    currentFaction.turns[turnIndex].name = name;
    turnModal.close();
    renderTurns();
    saveFactions();
}

function deleteTurn(event) {
    const turnIndex = event.target.dataset.turnIndex;
    if (confirm('Sei sicuro di voler eliminare questo turno?')) {
        currentFaction.turns.splice(turnIndex, 1);
        renderTurns();
        saveFactions();
    }
}

function addAction(event) {
    const turnIndex = event.target.dataset.turnIndex;
    currentTurn = currentFaction.turns[turnIndex];
    currentAction = null;
    actionForm.reset();
    actionModal.showModal();
    actionForm.dataset.turnIndex = turnIndex;
    actionForm.dataset.actionIndex = ''; // Nessun actionIndex per una nuova azione
}

function editAction(event) {
    const turnIndex = event.target.dataset.turnIndex;
    const actionIndex = event.target.dataset.actionIndex;
    currentTurn = currentFaction.turns[turnIndex];
    currentAction = currentTurn.actions[actionIndex];

    // Precompila il form con i dati dell'azione
    document.getElementById('action-type').value = currentAction.type;
    document.getElementById('action-result').value = currentAction.result;
    document.getElementById('action-method').value = currentAction.method;
    document.getElementById('action-resources').value = currentAction.resources.join(', ');

    actionModal.showModal();
    actionForm.dataset.turnIndex = turnIndex;
    actionForm.dataset.actionIndex = actionIndex;
}


// Funzione per caricare le sessioni disponibili
function loadSessions() {
    database.ref('sessions').once('value')
        .then(snapshot => {
            const data = snapshot.val() || {};
            const sessionsList = Object.entries(data).map(([id, session]) => ({
                id,
                title: session.title || 'Sessione senza titolo'
            }));
            renderSessions(sessionsList);
        })
        .catch(error => {
            console.error('Errore durante il caricamento delle sessioni:', error);
            alert('Errore durante il caricamento delle sessioni: ' + error.message);
        });
}

// Funzione per visualizzare le sessioni
function renderSessions(sessionsList) {
    sessionsContainer.innerHTML = '';
    sessionsList.forEach(session => {
        const sessionCard = document.createElement('article');
        sessionCard.classList.add('card');
        sessionCard.innerHTML = `
            <h3>${session.title}</h3>
            <p>ID Sessione: ${session.id}</p>
            <button data-id="${session.id}" class="open-session-button">Apri Sessione</button>
            <button data-id="${session.id}" class="copy-link-button">Copia Link</button>
        `;
        sessionsContainer.appendChild(sessionCard);
    });

    // Aggiungi event listener ai pulsanti
    const openSessionButtons = document.querySelectorAll('.open-session-button');
    openSessionButtons.forEach(button => {
        button.addEventListener('click', openSession);
    });

    const copyLinkButtons = document.querySelectorAll('.copy-link-button');
    copyLinkButtons.forEach(button => {
        button.addEventListener('click', copySessionLink);
    });
}

// Funzione per aprire una sessione esistente
function openSession(event) {
    sessionId = event.target.dataset.id;
    window.history.pushState({}, '', `?session=${sessionId}`);
    // Nascondi la sezione delle sessioni e mostra la sezione delle fazioni
    sessionsSection.style.display = 'none';
    factionsSection.style.display = 'block';
    turnsSection.style.display = 'none';
    // Aggiorna il titolo della sessione
    database.ref(`sessions/${sessionId}/title`).once('value')
        .then(snapshot => {
            const title = snapshot.val() || 'Sessione senza titolo';
            document.getElementById('session-title').textContent = title;
        });
    // Carica le fazioni della sessione
    loadFactions();
}


// Funzione per copiare il link della sessione
function copySessionLink(event) {
    const sessionId = event.target.dataset.id;
    const sessionURL = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;
    navigator.clipboard.writeText(sessionURL)
        .then(() => {
            alert('Link copiato negli appunti!');
        })
        .catch(error => {
            console.error('Errore durante la copia del link:', error);
            alert('Errore durante la copia del link: ' + error.message);
        });
}

//Funzione per ottenere l'ID della sessione dall'URL
function getSessionIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    console.log('Session ID from URL:', sessionId);
    return sessionId;
}


// Funzione per mostrare il prompt della sessione
function showSessionPrompt() {
    const action = confirm('Vuoi creare una nuova sessione? Premi "Annulla" per inserire un ID di sessione esistente.');
    if (action) {
        createNewSession();
    } else {
        const inputSessionId = prompt('Inserisci l\'ID della sessione:');
        if (inputSessionId) {
            sessionId = inputSessionId;
            window.history.pushState({}, '', `?session=${sessionId}`);
            loadFactions();
        } else {
            alert('Nessuna sessione selezionata. Ricarica la pagina per riprovare.');
        }
    }
}

// Funzione per creare una nuova sessione
function createNewSession(event) {
    event.preventDefault();
    const title = document.getElementById('new-session-title').value; // Aggiornato l'id qui
    const newSessionRef = database.ref('sessions').push();
    sessionId = newSessionRef.key;
    // Salva il titolo della sessione nel database
    newSessionRef.set({
        title: title
    })
    .then(() => {
        window.history.pushState({}, '', `?session=${sessionId}`);
        // Nascondi la sezione delle sessioni e mostra la sezione delle fazioni
        sessionsSection.style.display = 'none';
        factionsSection.style.display = 'block';
        turnsSection.style.display = 'none';
        // Aggiorna il titolo della sessione nella sezione delle fazioni
        document.getElementById('session-title').textContent = title;
        factions = [];
        renderFactions();
        createSessionModal.close();
    })
    .catch(error => {
        console.error('Errore durante la creazione della sessione:', error);
        alert('Errore durante la creazione della sessione: ' + error.message);
    });
}

// Funzioni per gestire le fazioni
function renderFactions() {
    factionsContainer.innerHTML = '';
    factions.forEach(faction => {
        const card = document.createElement('article');
        card.classList.add('card');
        card.innerHTML = `
            <h3>${faction.name}</h3>
            <p>${faction.description}</p>
            <button data-id="${faction.id}" class="open-faction-button">Gestisci Turni</button>
            <button data-id="${faction.id}" class="edit-faction-button">Modifica</button>
            <button data-id="${faction.id}" class="delete-faction-button">Elimina</button>
        `;
        factionsContainer.appendChild(card);
    });

    // Aggiungi event listener ai pulsanti delle fazioni
    const openFactionButtons = document.querySelectorAll('.open-faction-button');
    openFactionButtons.forEach(button => {
        button.addEventListener('click', openFaction);
    });

    const editFactionButtons = document.querySelectorAll('.edit-faction-button');
    editFactionButtons.forEach(button => {
        button.addEventListener('click', editFaction);
    });

    const deleteFactionButtons = document.querySelectorAll('.delete-faction-button');
    deleteFactionButtons.forEach(button => {
        button.addEventListener('click', deleteFaction);
    });
}

function openFaction(event) {
    const factionId = event.target.dataset.id;
    currentFaction = factions.find(f => f.id === factionId);
    factionTitle.textContent = currentFaction.name;
    factionsSection.style.display = 'none';
    turnsSection.style.display = 'block';
    renderTurns();
}

function backToFactions() {
    turnsSection.style.display = 'none';
    factionsSection.style.display = 'block';
    currentFaction = null;
}

function addFaction(event) {
    event.preventDefault();
    const name = document.getElementById('faction-name').value;
    const description = document.getElementById('faction-description').value;
    if (factionModalTitle.textContent === 'Nuova Fazione') {
        const newFaction = {
            id: 'faction-' + Date.now(),
            name: name,
            description: description,
            turns: []
        };
        factions.push(newFaction);
    } else if (factionModalTitle.textContent === 'Modifica Fazione') {
        currentFaction.name = name;
        currentFaction.description = description;
    }
    renderFactions();
    factionForm.reset();
    factionModal.close();
    saveFactions(); // Salva le fazioni nel localStorage
}

function editFaction(event) {
    const factionId = event.target.dataset.id;
    currentFaction = factions.find(f => f.id === factionId);
    document.getElementById('faction-name').value = currentFaction.name;
    document.getElementById('faction-description').value = currentFaction.description;
    factionModalTitle.textContent = 'Modifica Fazione';
    factionModal.showModal();
}

function deleteFaction(event) {
    const factionId = event.target.dataset.id;
    if (confirm('Sei sicuro di voler eliminare questa fazione?')) {
        factions = factions.filter(f => f.id !== factionId);
        renderFactions();
        saveFactions(); // Salva le fazioni nel localStorage
    }
}

// Funzioni per gestire i turni
function renderTurns() {
    turnsContainer.innerHTML = '';

    // Assicurati che currentFaction.turns sia un array
    currentFaction.turns = currentFaction.turns || [];
    if (!Array.isArray(currentFaction.turns)) {
        currentFaction.turns = Object.values(currentFaction.turns);
    }

    currentFaction.turns.forEach((turn, index) => {
        turn.actions = turn.actions || [];
        if (!Array.isArray(turn.actions)) {
            turn.actions = Object.values(turn.actions);
        }
    
        const turnCard = document.createElement('article');
        turnCard.classList.add('card');
    
        const actionsHTML = turn.actions.map((action, actionIndex) => `
            <article class="card action-card">
                <h4>${action.type === 'main' ? 'Azione Principale' : 'Azione del Leader'}</h4>
                <p><strong>Risultato:</strong> ${action.result}</p>
                <p><strong>Metodo:</strong> ${action.method}</p>
                <p><strong>Risorse:</strong> ${action.resources.join(', ')}</p>
                <button data-turn-index="${index}" data-action-index="${actionIndex}" class="edit-action-button">Modifica Azione</button>
                <button data-turn-index="${index}" data-action-index="${actionIndex}" class="delete-action-button">Elimina Azione</button>
                <button data-turn-index="${index}" data-action-index="${actionIndex}" class="manage-advantages-button">Gestisci Vantaggi/Svantaggi</button>
            </article>
        `).join('');
    
        turnCard.innerHTML = `
            <h3>Turno ${index + 1}</h3>
            <div>${actionsHTML}</div>
            ${turn.actions.length < 2 ? `<button data-turn-index="${index}" class="add-action-button">Aggiungi Azione</button>` : ''}
        `;
    
        turnsContainer.appendChild(turnCard);
    });
    

    // Aggiungi event listener per i pulsanti
    const addActionButtons = document.querySelectorAll('.add-action-button');
    addActionButtons.forEach(button => {
        button.addEventListener('click', addAction);
    });

    const manageAdvantagesButtons = document.querySelectorAll('.manage-advantages-button');
    manageAdvantagesButtons.forEach(button => {
        button.addEventListener('click', manageAdvantages);
    });
    
    // Event listener per i pulsanti di modifica dei turni
    const editTurnButtons = document.querySelectorAll('.edit-turn-button');
    editTurnButtons.forEach(button => {
        button.addEventListener('click', editTurn);
    });

    // Event listener per i pulsanti di cancellazione dei turni
    const deleteTurnButtons = document.querySelectorAll('.delete-turn-button');
    deleteTurnButtons.forEach(button => {
        button.addEventListener('click', deleteTurn);
    });

    // Event listener per i pulsanti di modifica delle azioni
    const editActionButtons = document.querySelectorAll('.edit-action-button');
    editActionButtons.forEach(button => {
        button.addEventListener('click', editAction);
    });

    // Event listener per i pulsanti di cancellazione delle azioni
    const deleteActionButtons = document.querySelectorAll('.delete-action-button');
    deleteActionButtons.forEach(button => {
        button.addEventListener('click', deleteAction);
});


}


function addTurn() {
    const newTurn = {
        actions: []
    };
    currentFaction.turns.push(newTurn);
    renderTurns();
    saveFactions(); // Salva le fazioni nel localStorage
}

function addAction(event) {
    const turnIndex = event.target.dataset.turnIndex;
    currentTurn = currentFaction.turns[turnIndex];

    currentAction = null; // Indichiamo che stiamo aggiungendo una nuova azione
    actionForm.reset(); // Resettiamo il form
    actionModal.showModal();

    actionForm.dataset.turnIndex = turnIndex; // Impostiamo il turno corrente
    actionForm.dataset.actionIndex = ''; // Nuova azione, quindi nessun indice
}


function saveAction(event) {
    event.preventDefault();

    const turnIndex = actionForm.dataset.turnIndex; // Ottieni l'indice del turno
    const actionIndex = actionForm.dataset.actionIndex; // Ottieni l'indice dell'azione
    currentTurn = currentFaction.turns[turnIndex]; // Assicurati di lavorare con il turno corrente

    const type = document.getElementById('action-type').value;
    const result = document.getElementById('action-result').value;
    const method = document.getElementById('action-method').value;
    const resourcesInput = document.getElementById('action-resources').value;
    const resources = resourcesInput.split(',').map(r => r.trim());

    const actionData = {
        type: type,
        result: result,
        method: method,
        resources: resources,
        advantages: currentAction ? currentAction.advantages : [...resources],
        disadvantages: currentAction ? currentAction.disadvantages : []
    };

    // Controlla se si tratta di una nuova azione o di una modifica
    if (actionIndex === '') {
        // Aggiungi una nuova azione
        currentTurn.actions.push(actionData);
    } else {
        // Modifica l'azione esistente
        currentTurn.actions[actionIndex] = actionData;
    }

    renderTurns(); // Aggiorna la visualizzazione
    actionModal.close(); // Chiudi la modale
    saveFactions(); // Salva i dati nel database
}


function deleteAction(event) {
    const turnIndex = event.target.dataset.turnIndex;
    const actionIndex = event.target.dataset.actionIndex;
    if (confirm('Sei sicuro di voler eliminare questa azione?')) {
        currentFaction.turns[turnIndex].actions.splice(actionIndex, 1);
        renderTurns();
        saveFactions();
    }
}

function manageAdvantages(event) {
    const turnIndex = event.target.dataset.turnIndex;
    const actionIndex = event.target.dataset.actionIndex;

    console.log('Gestione Vantaggi/Svantaggi per Turno:', turnIndex, 'Azione:', actionIndex);

    // Verifica che le strutture dati siano definite
    if (
        currentFaction &&
        currentFaction.turns &&
        currentFaction.turns[turnIndex] &&
        currentFaction.turns[turnIndex].actions &&
        currentFaction.turns[turnIndex].actions[actionIndex]
    ) {
        currentAction = currentFaction.turns[turnIndex].actions[actionIndex];

        // Assicuriamoci che currentAction sia definito
        if (!currentAction) {
            console.error('currentAction è undefined');
            return;
        }

        renderAdvantagesDisadvantages();
        advDisadvModal.showModal();
    } else {
        console.error('Impossibile trovare l\'azione specificata.');
        alert('Errore: Azione non trovata o dati non validi.');
    }
}

// Funzioni per gestire vantaggi e svantaggi
function renderAdvantagesDisadvantages() {
    currentAction.advantages = currentAction.advantages || [];
    if (!Array.isArray(currentAction.advantages)) {
        currentAction.advantages = Object.values(currentAction.advantages);
    }

    currentAction.disadvantages = currentAction.disadvantages || [];
    if (!Array.isArray(currentAction.disadvantages)) {
        currentAction.disadvantages = Object.values(currentAction.disadvantages);
    }

    advantagesList.innerHTML = '';
    currentAction.advantages.forEach((advantage, index) => {
        const li = document.createElement('li');
        li.textContent = advantage;
        li.dataset.index = index;
        li.classList.add('advantage');
        // Aggiungi opzioni per modificare ed eliminare
        const editButton = document.createElement('button');
        editButton.textContent = 'Modifica';
        editButton.addEventListener('click', () => editAdvantage(index));
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Elimina';
        deleteButton.addEventListener('click', () => deleteAdvantage(index));
        li.appendChild(editButton);
        li.appendChild(deleteButton);
        advantagesList.appendChild(li);
    });

    disadvantagesList.innerHTML = '';
    currentAction.disadvantages.forEach((disadvantage, index) => {
        const li = document.createElement('li');
        li.textContent = disadvantage;
        li.dataset.index = index;
        li.classList.add('disadvantage');
        // Aggiungi opzioni per modificare ed eliminare
        const editButton = document.createElement('button');
        editButton.textContent = 'Modifica';
        editButton.addEventListener('click', () => editDisadvantage(index));
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Elimina';
        deleteButton.addEventListener('click', () => deleteDisadvantage(index));
        li.appendChild(editButton);
        li.appendChild(deleteButton);
        disadvantagesList.appendChild(li);
    });
}

function addAdvantage() {
    const advantageText = advantageInput.value.trim();
    if (advantageText !== '') {
        currentAction.advantages.push(advantageText);
        renderAdvantagesDisadvantages();
        advantageInput.value = '';
        saveFactions(); // Salva le fazioni nel localStorage
    }
}

function addDisadvantage() {
    const disadvantageText = disadvantageInput.value.trim();
    if (disadvantageText !== '') {
        currentAction.disadvantages.push(disadvantageText);
        renderAdvantagesDisadvantages();
        disadvantageInput.value = '';
        saveFactions(); // Salva le fazioni nel localStorage
    }
}

function editAdvantage(index) {
    const newAdvantage = prompt('Modifica Vantaggio:', currentAction.advantages[index]);
    if (newAdvantage !== null && newAdvantage.trim() !== '') {
        currentAction.advantages[index] = newAdvantage.trim();
        renderAdvantagesDisadvantages();
        saveFactions(); // Salva le fazioni nel localStorage
    }
}

function deleteAdvantage(index) {
    if (confirm('Sei sicuro di voler eliminare questo vantaggio?')) {
        currentAction.advantages.splice(index, 1);
        renderAdvantagesDisadvantages();
        saveFactions(); // Salva le fazioni nel localStorage
    }
}

function editDisadvantage(index) {
    const newDisadvantage = prompt('Modifica Svantaggio:', currentAction.disadvantages[index]);
    if (newDisadvantage !== null && newDisadvantage.trim() !== '') {
        currentAction.disadvantages[index] = newDisadvantage.trim();
        renderAdvantagesDisadvantages();
        saveFactions(); // Salva le fazioni nel localStorage
    }
}

function deleteDisadvantage(index) {
    if (confirm('Sei sicuro di voler eliminare questo svantaggio?')) {
        currentAction.disadvantages.splice(index, 1);
        renderAdvantagesDisadvantages();
        saveFactions(); // Salva le fazioni nel localStorage
    }
}

// Funzioni per salvare e caricare le fazioni dal localStorage
function loadFactions() {
    sessionId = getSessionIdFromURL();
    if (!sessionId) {
        // Se non c'è una sessione selezionata, mostra la lista delle sessioni
        sessionsSection.style.display = 'block';
        factionsSection.style.display = 'none';
        turnsSection.style.display = 'none';
        loadSessions(); // Carica le sessioni disponibili
        return;
    }
    // Nascondi la sezione delle sessioni e mostra la sezione delle fazioni
    sessionsSection.style.display = 'none';
    factionsSection.style.display = 'block';
    turnsSection.style.display = 'none';

    // Aggiorna il titolo della sessione
    database.ref(`sessions/${sessionId}/title`).once('value')
        .then(snapshot => {
            const title = snapshot.val() || 'Sessione senza titolo';
            document.getElementById('session-title').textContent = title;
        })
        .catch(error => {
            console.error('Errore durante il caricamento del titolo della sessione:', error);
            alert('Errore durante il caricamento del titolo della sessione: ' + error.message);
        });

    // Carica le fazioni della sessione selezionata
    database.ref(`sessions/${sessionId}/factions`).on('value', snapshot => {
        const data = snapshot.val() || {};
        factions = Object.values(data);
        renderFactions();
    }, error => {
        console.error('Errore durante il caricamento delle fazioni:', error);
        alert('Errore durante il caricamento delle fazioni: ' + error.message);
    });
}



function saveFactions() {
    const factionsToSave = {};
    factions.forEach(faction => {
        factionsToSave[faction.id] = faction;
    });
    database.ref(`sessions/${sessionId}/factions`).set(factionsToSave);
}

// Funzione per aggiornare le informazioni della sessione
function updateSessionInfo() {
    const sessionInfo = document.getElementById('session-info');
    const sessionIdElement = document.getElementById('session-id');
    const sessionLink = document.getElementById('session-link');
    if (sessionId) {
        sessionInfo.style.display = 'block';
        sessionIdElement.textContent = sessionId;
        const sessionURL = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;
        sessionLink.href = sessionURL;
        sessionLink.textContent = sessionURL;
    } else {
        sessionInfo.style.display = 'none';
    }
}

function backToSessions() {
    // Scollega l'ascoltatore del database per le fazioni
    database.ref(`sessions/${sessionId}/factions`).off();
    sessionId = null;
    window.history.pushState({}, '', window.location.pathname);
    sessionsSection.style.display = 'block';
    factionsSection.style.display = 'none';
    loadSessions();
}


// Event Listeners

createSessionButton.addEventListener('click', () => {
    createSessionForm.reset();
    createSessionModal.showModal();
});

closeCreateSessionModalButton.addEventListener('click', () => {
    createSessionModal.close();
});

createSessionForm.addEventListener('submit', createNewSession);


addFactionButton.addEventListener('click', () => {
    factionModalTitle.textContent = 'Nuova Fazione';
    factionForm.reset();
    factionModal.showModal();
});

closeFactionModalButton.addEventListener('click', () => factionModal.close());
factionForm.addEventListener('submit', addFaction);

backToFactionsButton.addEventListener('click', backToFactions);
addTurnButton.addEventListener('click', addTurn);

actionForm.addEventListener('submit', saveAction);
closeActionModalButton.addEventListener('click', () => actionModal.close());

addAdvantageButton.addEventListener('click', addAdvantage);
addDisadvantageButton.addEventListener('click', addDisadvantage);
closeAdvDisadvModalButton.addEventListener('click', () => advDisadvModal.close());

backToSessionsButton.addEventListener('click', backToSessions);


// Inizializzazione
loadFactions();
