// File: players.js
// Manages the player addition and card display page (players.html)

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    // ... (DOM elements remain the same) ...
    const addPlayerForm = document.getElementById('add-player-form');
    const playerNameInput = document.getElementById('player-name-input');
    const playerImageInput = document.getElementById('player-image-input');
    const playerCardsContainer = document.getElementById('player-cards-container');
    const noPlayersMessage = document.getElementById('no-players-message');
    const playerCountDisplay = document.getElementById('player-count-display');


    // --- State ---
    // ... (State variables remain the same) ...
    const STORAGE_KEY_PLAYERS = 'torneoFisioPlayersList';
    const STORAGE_KEY_MATCHES = 'torneoFisioMatches';
    const DEFAULT_IMAGE = 'images/default_avatar.png';
    let players = [];
    let allMatches = [];


    // --- Helper Functions ---
    // ... (getRandomPastelColor, getTextColorForBackground, loadMatches, getPlayerNameById remain the same) ...
     function getRandomPastelColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = Math.floor(Math.random() * 30) + 70; // 70-100%
        const lightness = Math.floor(Math.random() * 20) + 75; // 75-95%
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    function getTextColorForBackground(hslColor) {
        try {
            if (!hslColor) return 'black';
            const lightnessMatch = hslColor.match(/,\s*(\d+)%\)/);
            if (!lightnessMatch || !lightnessMatch[1]) {
                console.warn("Could not parse lightness from HSL:", hslColor);
                return 'black';
            }
            const lightness = parseInt(lightnessMatch[1]);
            return lightness > 65 ? 'black' : 'white';
        } catch (e) {
            console.error("Error parsing HSL color:", hslColor, e);
            return 'black';
        }
    }

    function loadMatches() {
        const storedMatches = localStorage.getItem(STORAGE_KEY_MATCHES);
        try {
            allMatches = storedMatches ? JSON.parse(storedMatches) : [];
            if (!Array.isArray(allMatches)) {
                console.warn("Stored matches data is not an array, resetting.");
                allMatches = [];
            }
        } catch (error) {
            console.error("Error parsing matches from localStorage:", error);
            allMatches = [];
        }
        console.log("Matches loaded for history display:", allMatches.length);
    }

    function getPlayerNameById(id) {
        if (id === null || id === undefined) return 'Sconosciuto';
        if (id === 'BYE') return 'BYE';
        const player = players.find(p => p.id === id);
        return player ? player.name : 'Giocatore Rimosso';
    }


    // Creates the HTML element for a single player card including match history
    function createPlayerCardElement(player) {
        // ... (Initial card setup remains the same) ...
        const card = document.createElement('div');
        card.classList.add('player-card');
        card.dataset.playerId = player.id;
        if (!player.color) player.color = getRandomPastelColor();
        card.style.backgroundColor = player.color;
        const textColor = getTextColorForBackground(player.color);
        card.style.color = textColor;

        const playerImage = document.createElement('img');
        playerImage.src = player.image || DEFAULT_IMAGE;
        playerImage.alt = player.name;
        playerImage.classList.add('player-card-image');
        playerImage.onerror = function() { this.src = DEFAULT_IMAGE; };

        const nameHeader = document.createElement('h3');
        nameHeader.textContent = player.name;

        const statsDiv = document.createElement('div');
        statsDiv.classList.add('player-stats');
        const statsHeader = document.createElement('h4');
        statsHeader.textContent = 'Storico Partite:';
        const matchList = document.createElement('ul');
        matchList.classList.add('match-history-list');
        const noMatchesPara = document.createElement('p');
        noMatchesPara.classList.add('no-matches');
        noMatchesPara.textContent = 'Nessuna partita registrata.';
        noMatchesPara.style.display = 'none';

        // Populate Match History
        const completedMatches = allMatches.filter(match =>
            match.status === 'completed' &&
            match.player1Id !== 'BYE' &&
            match.player2Id !== 'BYE' &&
            (match.player1Id === player.id || match.player2Id === player.id)
        ).sort((a, b) => (b.endTime || 0) - (a.endTime || 0));

        if (completedMatches.length > 0) {
            completedMatches.forEach(match => {
                const isPlayer1 = match.player1Id === player.id;
                const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
                const opponentName = getPlayerNameById(opponentId);

                const didWin = match.winnerId === player.id;
                const outcomeText = didWin ? 'Vinto' : 'Perso';
                let scoreText = '';
                let aggregateText = ''; // For aggregate score

                // *** UPDATED LOGIC FOR SCORE & AGGREGATE DISPLAY ***
                if (match.gameFormat === 'bestOf3') {
                    const playerGames = isPlayer1 ? match.gamesWon1 : match.gamesWon2;
                    const opponentGames = isPlayer1 ? match.gamesWon2 : match.gamesWon1;
                    const pGames = (typeof playerGames === 'number') ? playerGames : 0;
                    const oGames = (typeof opponentGames === 'number') ? opponentGames : 0;
                    scoreText = `${pGames} - ${oGames} (Games)`;

                    // Calculate aggregate score if gameScores exists
                    if (Array.isArray(match.gameScores) && match.gameScores.length > 0) {
                        let aggregateP1 = 0;
                        let aggregateP2 = 0;
                        match.gameScores.forEach(game => {
                             if (Array.isArray(game) && game.length === 2) {
                                 aggregateP1 += (typeof game[0] === 'number' ? game[0] : 0);
                                 aggregateP2 += (typeof game[1] === 'number' ? game[1] : 0);
                             }
                        });
                        const playerAggregate = isPlayer1 ? aggregateP1 : aggregateP2;
                        const opponentAggregate = isPlayer1 ? aggregateP2 : aggregateP1;
                        aggregateText = ` (${playerAggregate}-${opponentAggregate} agg.)`; // Add aggregate in brackets
                    }
                } else {
                    // Single game format (or unknown) - display final score
                    const playerScore = isPlayer1 ? match.score1 : match.score2;
                    const opponentScore = isPlayer1 ? match.score2 : match.score1;
                    const pScore = (typeof playerScore === 'number') ? playerScore : 0;
                    const oScore = (typeof opponentScore === 'number') ? opponentScore : 0;
                    scoreText = `${pScore} - ${oScore}`;
                }
                // *** END OF UPDATED LOGIC ***

                const listItem = document.createElement('li');
                // Combine score text and aggregate text
                listItem.innerHTML = `Vs ${opponentName}: <strong>${outcomeText}</strong> ${scoreText}${aggregateText}`;
                matchList.appendChild(listItem);
            });
            noMatchesPara.style.display = 'none';
        } else {
            noMatchesPara.style.display = 'block';
        }

        // ... (Delete Button remains the same) ...
         const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-player-btn');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = `Rimuovi ${player.name}`;
        deleteBtn.onclick = (event) => {
             event.stopPropagation();
             removePlayer(player.id);
        };
        deleteBtn.style.color = textColor === 'white' ? 'black' : 'white';
        deleteBtn.style.background = textColor === 'white' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';


        // Assemble card
        statsDiv.appendChild(statsHeader);
        statsDiv.appendChild(matchList);
        statsDiv.appendChild(noMatchesPara);
        card.appendChild(playerImage);
        card.appendChild(nameHeader);
        card.appendChild(statsDiv);
        card.appendChild(deleteBtn);

        return card;
    }

    // ... (renderPlayerCards, addPlayer, removePlayer, savePlayers, loadPlayers functions remain the same as the previous version) ...
     function renderPlayerCards() {
        loadMatches();

        playerCardsContainer.innerHTML = '';
        if (players.length === 0) {
            noPlayersMessage.style.display = 'block';
        } else {
            noPlayersMessage.style.display = 'none';
            const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));

            sortedPlayers.forEach(player => {
                if (!player.color) player.color = getRandomPastelColor();
                if (!player.image) player.image = DEFAULT_IMAGE;

                const cardElement = createPlayerCardElement(player);
                playerCardsContainer.appendChild(cardElement);
            });
            savePlayers();
        }
        playerCountDisplay.textContent = players.length;
    }

    function addPlayer(event) {
        event.preventDefault();
        const name = playerNameInput.value.trim();
        const imageFilename = playerImageInput.value.trim();
        if (!name) {
            alert("Inserisci almeno il nome del giocatore.");
            return;
        }

        if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            alert(`Il giocatore "${name}" è già stato aggiunto.`);
            return;
        }

        let imagePath = DEFAULT_IMAGE;
        if (imageFilename) {
            if (imageFilename.includes('/') || imageFilename.includes('\\')) {
                 alert("Inserisci solo il nome del file immagine (es: 'mio_avatar.png'). Le immagini devono essere nella cartella 'images'.");
                 return;
             }
            imagePath = `images/${imageFilename}`;
        } else {
            console.log(`Nessun file immagine specificato per ${name}, uso il default.`);
        }

        const newPlayer = {
            id: Date.now(),
            name: name,
            color: getRandomPastelColor(),
            image: imagePath
        };
        players.push(newPlayer);
        playerNameInput.value = '';
        playerImageInput.value = '';
        savePlayers();
        renderPlayerCards();
    }

     function removePlayer(playerIdToRemove) {
        const playerToRemove = players.find(p => p.id === playerIdToRemove);
        if (!playerToRemove) return;

        if (confirm(`Sei sicuro di voler rimuovere ${playerToRemove.name}? Verrà rimosso anche dal tabellone e le sue partite registrate verranno aggiornate.`)) {
            players = players.filter(player => player.id !== playerIdToRemove);

            loadMatches();
            let matchesUpdated = false;
            allMatches = allMatches.map(match => {
                let updatedMatch = { ...match };
                let playerFound = false;

                if (updatedMatch.player1Id === playerIdToRemove) {
                    updatedMatch.player1Id = null; playerFound = true;
                }
                if (updatedMatch.player2Id === playerIdToRemove) {
                    updatedMatch.player2Id = null; playerFound = true;
                }

                if (playerFound) {
                    matchesUpdated = true;
                    updatedMatch.status = 'pending';
                    updatedMatch.winnerId = null;
                    updatedMatch.score1 = null;
                    updatedMatch.score2 = null;
                    updatedMatch.gamesWon1 = null;
                    updatedMatch.gamesWon2 = null;
                    updatedMatch.gameScores = null; // Clear game scores too
                    updatedMatch.startTime = null;
                    updatedMatch.endTime = null;
                    updatedMatch.duration = null;

                    if (updatedMatch.player1Id === 'BYE' && updatedMatch.player2Id !== null) {
                        updatedMatch.winnerId = updatedMatch.player2Id; updatedMatch.status = 'completed';
                    } else if (updatedMatch.player2Id === 'BYE' && updatedMatch.player1Id !== null) {
                        updatedMatch.winnerId = updatedMatch.player1Id; updatedMatch.status = 'completed';
                    }
                }
                return updatedMatch;
            });

            savePlayers();
            if (matchesUpdated) {
                localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(allMatches));
                console.log("Matches updated in localStorage after player removal.");
            }

            renderPlayerCards();

            alert(`${playerToRemove.name} rimosso. Il tabellone principale potrebbe richiedere una rigenerazione per riflettere correttamente le modifiche.`);
        }
     }

    function savePlayers() {
        localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
        console.log("Players saved:", players.length);
    }

    function loadPlayers() {
        const storedPlayers = localStorage.getItem(STORAGE_KEY_PLAYERS);
        players = storedPlayers ? JSON.parse(storedPlayers) : [];
        console.log("Players loaded:", players.length);
    }

    // --- Initialisation ---
    addPlayerForm.addEventListener('submit', addPlayer);
    loadPlayers();
    renderPlayerCards();

}); // End DOMContentLoaded