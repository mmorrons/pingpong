// File: script.js
// Manages the main tournament bracket page (index.html)

document.addEventListener('DOMContentLoaded', () => {
    console.log("Main bracket page script loaded.");

    // --- Constants ---
    const STORAGE_KEY_PLAYERS = 'torneoFisioPlayersList';
    const STORAGE_KEY_MATCHES = 'torneoFisioMatches';
    const STORAGE_KEY_SETTINGS = 'torneoFisioSettings';
    const STORAGE_KEY_CURRENT_MATCH = 'torneoFisioCurrentMatchId';
    const STORAGE_KEY_MATCH_START_TIME = 'torneoFisioMatchStartTime';
    const DEFAULT_IMAGE = 'images/blank_avatar.png'; // Default blank head icon

    // --- DOM Elements ---
    const bracketSizeSelect = document.getElementById('bracket-size-select');
    const gameFormatSelect = document.getElementById('game-format-select');
    const targetScoreSelect = document.getElementById('target-score-select');
    const generateButton = document.getElementById('generate-bracket-button');
    const generateInfo = document.getElementById('generate-info');
    const bracketDisplayContainer = document.getElementById('bracket-display-container');
    const bracketPlaceholder = document.getElementById('bracket-placeholder');
    const winnerSection = document.getElementById('tournament-winner-section');
    const winnerImage = document.getElementById('winner-image');
    const winnerNameDisplay = document.getElementById('winner-name');

    // --- State ---
    let players = [];
    let allMatches = [];
    let tournamentSettings = {
        bracketSize: 16,
        gameFormat: 'single',
        targetScore: 11,
        generated: false
    };

    // --- Helper Functions ---

    function loadPlayers() {
        const storedPlayers = localStorage.getItem(STORAGE_KEY_PLAYERS);
        players = storedPlayers ? JSON.parse(storedPlayers) : [];
        console.log("Players loaded:", players.length);
        updateGenerateButtonStatus();
    }

    function loadSettings() {
        const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (storedSettings) {
            tournamentSettings = JSON.parse(storedSettings);
            console.log("Settings loaded:", tournamentSettings);
            bracketSizeSelect.value = tournamentSettings.bracketSize;
            gameFormatSelect.value = tournamentSettings.gameFormat;
            targetScoreSelect.value = tournamentSettings.targetScore;
        } else {
            console.log("No settings found, using defaults.");
            saveSettings();
        }
    }

    function saveSettings() {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(tournamentSettings));
        console.log("Settings saved:", tournamentSettings);
    }

    function loadMatches() {
        const storedMatches = localStorage.getItem(STORAGE_KEY_MATCHES);
        try {
            allMatches = storedMatches ? JSON.parse(storedMatches) : [];
             if (!Array.isArray(allMatches)) {
                console.warn("Stored matches data is not an array, resetting.");
                allMatches = [];
                tournamentSettings.generated = false;
                saveSettings();
            }
            console.log("Matches loaded:", allMatches.length);
        } catch (error) {
            console.error("Error parsing matches from localStorage:", error);
            allMatches = [];
            tournamentSettings.generated = false;
            saveSettings();
        }
    }

    function getPlayerInfo(playerId) {
        // *** No change needed here, still return default image info for consistency ***
        // *** The decision to *use* the image happens later ***
        if (playerId === null || playerId === undefined) return { name: 'TBD', color: null, image: DEFAULT_IMAGE };
        if (playerId === 'BYE') return { name: 'BYE', color: null, image: DEFAULT_IMAGE }; // Still provide image info
        const player = players.find(p => p.id === playerId);
        return player
            ? { name: player.name, color: player.color || null, image: player.image || DEFAULT_IMAGE }
            : { name: 'Giocatore Rimosso', color: null, image: DEFAULT_IMAGE };
    }

    function shuffleArray(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    // --- Bracket Generation Logic ---

    function generateBracket() {
        console.log("Generating bracket...");
        const selectedSize = parseInt(bracketSizeSelect.value);
        const numPlayers = players.length;

        if (numPlayers < 2) {
            generateInfo.textContent = "Aggiungi almeno 2 giocatori per generare il tabellone.";
            alert("Aggiungi almeno 2 giocatori per generare il tabellone.");
            return;
        }

         if (numPlayers > selectedSize) {
            generateInfo.textContent = `Ci sono ${numPlayers} giocatori ma la dimensione del tabellone è ${selectedSize}. Rimuovi giocatori o aumenta la dimensione.`;
            alert(`Ci sono ${numPlayers} giocatori ma la dimensione del tabellone è ${selectedSize}. Rimuovi giocatori o aumenta la dimensione.`);
             return;
        }

        if (tournamentSettings.generated && !confirm("Un tabellone esiste già. Rigenerarlo cancellerà i progressi attuali. Continuare?")) {
            return;
        }

        tournamentSettings.bracketSize = selectedSize;
        tournamentSettings.gameFormat = gameFormatSelect.value;
        tournamentSettings.targetScore = parseInt(targetScoreSelect.value);
        tournamentSettings.generated = true;

        let bracketPlayers = [...players];
        shuffleArray(bracketPlayers);

        const byesNeeded = selectedSize - numPlayers;
        let initialParticipants = bracketPlayers.map(p => p.id);
        for (let i = 0; i < byesNeeded; i++) {
             initialParticipants.push('BYE');
        }
        shuffleArray(initialParticipants);

        allMatches = [];
        let roundNumber = 1;
        let currentRoundMatches = [];
        let matchCounter = 0;

        for (let i = 0; i < selectedSize / 2; i++) {
            matchCounter++;
            const matchId = `M${roundNumber}-${i + 1}`;
            const p1Id = initialParticipants[i * 2];
            const p2Id = initialParticipants[i * 2 + 1];
            let status = 'pending';
            let winnerId = null;

            if (p1Id === 'BYE' && p2Id !== 'BYE') { winnerId = p2Id; status = 'completed'; }
            else if (p2Id === 'BYE' && p1Id !== 'BYE') { winnerId = p1Id; status = 'completed'; }
            else if (p1Id !== 'BYE' && p2Id !== 'BYE') { status = 'ready'; }
            else if (p1Id === 'BYE' && p2Id === 'BYE') { status = 'bye'; winnerId = 'BYE'; }

            const match = {
                matchId, round: roundNumber, orderInRound: i + 1, player1Id: p1Id, player2Id: p2Id,
                score1: null, score2: null, gamesWon1: null, gamesWon2: null, gameScores: null,
                winnerId, status, nextMatchId: null, nextSlotIdentifier: null,
                startTime: null, endTime: null, duration: null
            };
            currentRoundMatches.push(match);
        }
        allMatches.push(...currentRoundMatches);

        let matchesInCurrentRound = selectedSize / 2;
        while (matchesInCurrentRound >= 1) {
            const previousRoundMatches = [...currentRoundMatches];
            currentRoundMatches = [];
            roundNumber++;
            matchesInCurrentRound /= 2;

            if (matchesInCurrentRound < 1) break;

            for (let i = 0; i < matchesInCurrentRound; i++) {
                matchCounter++;
                const matchId = `M${roundNumber}-${i + 1}`;
                const feedingMatch1Index = i * 2;
                const feedingMatch2Index = i * 2 + 1;
                const feedingMatch1Id = previousRoundMatches[feedingMatch1Index]?.matchId;
                const feedingMatch2Id = previousRoundMatches[feedingMatch2Index]?.matchId;

                const feedingMatch1 = allMatches.find(m => m.matchId === feedingMatch1Id);
                const feedingMatch2 = allMatches.find(m => m.matchId === feedingMatch2Id);
                if(feedingMatch1) { feedingMatch1.nextMatchId = matchId; feedingMatch1.nextSlotIdentifier = 'p1'; }
                if(feedingMatch2) { feedingMatch2.nextMatchId = matchId; feedingMatch2.nextSlotIdentifier = 'p2'; }

                let p1Id = feedingMatch1?.winnerId ?? null;
                let p2Id = feedingMatch2?.winnerId ?? null;
                let status = 'pending';
                let winnerId = null;

                if (p1Id === 'BYE' && p2Id !== 'BYE' && p2Id !== null) { winnerId = p2Id; status = 'completed'; }
                else if (p2Id === 'BYE' && p1Id !== 'BYE' && p1Id !== null) { winnerId = p1Id; status = 'completed'; }
                else if (p1Id !== null && p2Id !== null && p1Id !== 'BYE' && p2Id !== 'BYE') { status = 'ready'; }
                else if (p1Id === 'BYE' && p2Id === 'BYE') { status = 'bye'; winnerId = 'BYE'; }
                else if (p1Id === null || p2Id === null) { status = 'pending'; }

                const match = {
                    matchId, round: roundNumber, orderInRound: i + 1, player1Id: p1Id, player2Id: p2Id,
                    score1: null, score2: null, gamesWon1: null, gamesWon2: null, gameScores: null,
                    winnerId, status, nextMatchId: null, nextSlotIdentifier: null,
                    startTime: null, endTime: null, duration: null
                };
                currentRoundMatches.push(match);
            }
            allMatches.push(...currentRoundMatches);
        }

        console.log("Generated Matches:", allMatches);
        localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(allMatches));
        saveSettings();
        renderBracket();
        checkTournamentWinner();
        generateInfo.textContent = `Tabellone da ${selectedSize} generato con successo!`;
    }


    // --- Bracket Rendering ---

    function renderBracket() {
        bracketDisplayContainer.innerHTML = '';
        bracketPlaceholder.style.display = 'none';

        if (!tournamentSettings.generated || allMatches.length === 0) {
            bracketPlaceholder.textContent = "Nessun tabellone generato. Aggiungi giocatori e clicca 'Genera'.";
            bracketPlaceholder.style.display = 'block';
            winnerSection.style.display = 'none';
            return;
        }

        const rounds = {};
        allMatches.forEach(match => {
            if (!rounds[match.round]) rounds[match.round] = [];
            rounds[match.round].push(match);
        });

        const sortedRoundKeys = Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b));

        sortedRoundKeys.forEach(roundKey => {
            const roundDiv = document.createElement('div');
            roundDiv.classList.add('round');
            const roundTitle = document.createElement('h3');
            roundTitle.textContent = getRoundName(parseInt(roundKey), tournamentSettings.bracketSize);
            roundDiv.appendChild(roundTitle);

            const sortedMatches = rounds[roundKey].sort((a, b) => a.orderInRound - b.orderInRound);

            sortedMatches.forEach(match => {
                const matchElement = createMatchElement(match);
                roundDiv.appendChild(matchElement);
            });
            bracketDisplayContainer.appendChild(roundDiv);
        });
         checkTournamentWinner();
    }

    function getRoundName(roundNumber, bracketSize) {
        const totalRounds = Math.log2(bracketSize);
        if (roundNumber === totalRounds) return "Finale";
        if (roundNumber === totalRounds - 1) return "Semifinali";
        if (roundNumber === totalRounds - 2) return "Quarti di Finale";
        const roundMap = { 16: "Ottavi di Finale", 32: "Sedicesimi", 64: "Trentaduesimi" };
        return roundMap[Math.pow(2, totalRounds - roundNumber + 1 )] || `Round ${roundNumber}`;
    }

    function createMatchElement(match) {
        const matchDiv = document.createElement('div');
        matchDiv.classList.add('match');
        matchDiv.dataset.matchId = match.matchId;
        matchDiv.dataset.status = match.status;

        const p1Info = getPlayerInfo(match.player1Id);
        const p2Info = getPlayerInfo(match.player2Id);

        const p1Slot = createPlayerSlotElement(match.player1Id, p1Info, match);
        matchDiv.appendChild(p1Slot);

        const p2Slot = createPlayerSlotElement(match.player2Id, p2Info, match);
        matchDiv.appendChild(p2Slot);

        if ((match.status === 'ready' || match.status === 'completed') &&
            !(match.player1Id === 'BYE' && match.player2Id === 'BYE') &&
            !(match.status === 'completed' && (match.player1Id === 'BYE' || match.player2Id === 'BYE')))
        {
             const button = document.createElement('button');
             button.textContent = (match.status === 'ready') ? 'Gioca Partita' : 'Modifica Punteggio';
             button.classList.add((match.status === 'ready') ? 'play-match-button' : 'edit-score-button');
             button.onclick = () => handlePlayMatchClick(match.matchId, match.status);
             matchDiv.appendChild(button);
        }
        return matchDiv;
    }

     // *** MODIFIED FUNCTION ***
     function createPlayerSlotElement(playerId, playerInfo, match) {
         const slotDiv = document.createElement('div');
         slotDiv.classList.add('player-slot');

         // --- NEW LOGIC for BYE ---
         if (playerId === 'BYE') {
             slotDiv.classList.add('bye');
             const nameSpan = document.createElement('span');
             nameSpan.classList.add('player-name');
             nameSpan.textContent = playerInfo.name; // Should be "BYE"
             slotDiv.appendChild(nameSpan);
             // DO NOT add image or score for BYE
         }
         // --- END NEW LOGIC for BYE ---
         else { // --- Existing logic for non-BYE players ---
             const image = document.createElement('img');
             image.src = playerInfo.image; // Uses default from getPlayerInfo if needed
             image.alt = playerInfo.name;
             image.classList.add('player-slot-image');
             image.onerror = function() { this.src = DEFAULT_IMAGE; }; // Fallback to default
             slotDiv.appendChild(image);

             const nameSpan = document.createElement('span');
             nameSpan.classList.add('player-name');
             nameSpan.textContent = playerInfo.name;
             slotDiv.appendChild(nameSpan);

             const scoreSpan = document.createElement('span');
             scoreSpan.classList.add('score');

             let scoreText = '-';
             if (match.status === 'completed' && match.winnerId !== 'BYE') {
                 if (tournamentSettings.gameFormat === 'bestOf3') {
                     const gamesWon = (playerId === match.player1Id) ? match.gamesWon1 : match.gamesWon2;
                     scoreText = (gamesWon !== null) ? `${gamesWon}` : '-';
                 } else {
                     const score = (playerId === match.player1Id) ? match.score1 : match.score2;
                     scoreText = (score !== null) ? `${score}` : '-';
                 }
             }
             scoreSpan.textContent = scoreText;
             slotDiv.appendChild(scoreSpan);

             // Apply winner/loser/tbd styling (only for non-BYE)
             if (match.status === 'completed') {
                 if (match.winnerId === playerId) {
                     slotDiv.classList.add('winner');
                 } else if (match.winnerId !== null && match.winnerId !== 'BYE') {
                     slotDiv.classList.add('loser');
                 }
             } else if (playerId === null) {
                 slotDiv.classList.add('tbd');
                 nameSpan.textContent = 'TBD'; // Ensure TBD text if player ID is null
             }
         } // --- End existing logic ---

         return slotDiv;
     }


    // --- Event Handlers ---

    function handlePlayMatchClick(matchId, currentStatus) {
        console.log(`Play/Edit clicked for match ${matchId}, Status: ${currentStatus}`);
        localStorage.setItem(STORAGE_KEY_CURRENT_MATCH, matchId);
        if (currentStatus === 'ready') {
            localStorage.setItem(STORAGE_KEY_MATCH_START_TIME, Date.now().toString());
        } else {
             localStorage.removeItem(STORAGE_KEY_MATCH_START_TIME);
        }
        window.location.href = 'scoreboard.html';
    }

    function updateGenerateButtonStatus() {
        const selectedSize = parseInt(bracketSizeSelect.value);
        const numPlayers = players.length;

        if (numPlayers >= 2 && numPlayers <= selectedSize) {
             generateButton.disabled = false;
             generateInfo.textContent = `Pronto a generare tabellone da ${selectedSize} con ${numPlayers} giocatori.` + (selectedSize > numPlayers ? ` (${selectedSize - numPlayers} BYE)` : '');
         } else {
             generateButton.disabled = true;
             if (numPlayers < 2) { generateInfo.textContent = "Aggiungi almeno 2 giocatori."; }
             else if (numPlayers > selectedSize) { generateInfo.textContent = `Troppi giocatori (${numPlayers}) per tabellone da ${selectedSize}.`; }
             else { generateInfo.textContent = "Seleziona dimensione tabellone."; }
         }
    }

     function checkTournamentWinner() {
         if (!tournamentSettings.generated || allMatches.length === 0) {
             winnerSection.style.display = 'none'; return;
         }

         const finalRoundNumber = Math.log2(tournamentSettings.bracketSize);
         const finalMatch = allMatches.find(m => m.round === finalRoundNumber);

         if (finalMatch && finalMatch.status === 'completed' && finalMatch.winnerId && finalMatch.winnerId !== 'BYE') {
             const winnerInfo = getPlayerInfo(finalMatch.winnerId);
             winnerImage.src = winnerInfo.image; // Uses default via getPlayerInfo
             winnerImage.alt = winnerInfo.name;
             winnerImage.onerror = function() { this.src = DEFAULT_IMAGE; }; // Set fallback
             winnerNameDisplay.textContent = winnerInfo.name;
             winnerSection.style.display = 'block';

             if (typeof confetti === 'function') {
                 console.log("Triggering confetti!");
                  confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, zIndex: 1050 });
             }
         } else {
             winnerSection.style.display = 'none';
         }
     }

    // --- Initialisation ---
    loadPlayers();
    loadSettings();
    loadMatches();
    renderBracket();
    updateGenerateButtonStatus();

    generateButton.addEventListener('click', generateBracket);
    bracketSizeSelect.addEventListener('change', updateGenerateButtonStatus);
    gameFormatSelect.addEventListener('change', () => {
        tournamentSettings.gameFormat = gameFormatSelect.value;
        saveSettings();
        if(tournamentSettings.generated) { alert("Formato partita aggiornato. Le partite future useranno questa impostazione."); }
    });
     targetScoreSelect.addEventListener('change', () => {
        tournamentSettings.targetScore = parseInt(targetScoreSelect.value);
        saveSettings();
         if(tournamentSettings.generated) { alert("Punteggio vittoria aggiornato. Le partite future useranno questa impostazione."); }
    });

    console.log("Initialization complete.");

}); // End DOMContentLoaded
