document.addEventListener('DOMContentLoaded', () => {
    const addPlayerForm = document.getElementById('addPlayerForm');
    const playerNameInput = document.getElementById('playerName');
    const playerCardsContainer = document.getElementById('playerCardsContainer');
    const populateBracketButton = document.getElementById('populateBracketButton');
    const bracketSection = document.getElementById('bracket-section');
    const tournamentWinnerDisplay = document.getElementById('tournament-winner');
    const winnerDisplayCard = document.getElementById('winner-display');
    const resetTournamentButton = document.getElementById('resetTournamentButton');

    const MAX_PLAYERS = 16;
    const STORAGE_KEYS = {
        PLAYERS: 'torneoFisioPlayers',
        MATCHES: 'torneoFisioMatches'
    };

    let players = [];
    let matches = {}; // Store match data like { 'match-r1m1': { score1: 11, score2: 5, winner: 'Player A', loser: 'Player B', saved: true }, ... }

    // --- Player Management ---

    function renderPlayers() {
        playerCardsContainer.innerHTML = ''; // Clear existing cards
        players.forEach(player => {
            const card = document.createElement('div');
            card.classList.add('player-card');
            card.textContent = player.name;
            card.dataset.playerId = player.id; // Use unique ID if needed later
            playerCardsContainer.appendChild(card);
        });
         // Enable/disable populate button based on player count
        populateBracketButton.disabled = players.length !== MAX_PLAYERS;
        if (players.length > MAX_PLAYERS) {
            alert(`Puoi aggiungere massimo ${MAX_PLAYERS} giocatori.`);
            // Optionally remove the last added player
            players.pop();
            savePlayers();
            renderPlayers(); // Re-render
        }
    }

    function addPlayer(event) {
        event.preventDefault(); // Prevent page reload
        const name = playerNameInput.value.trim();
        if (name && players.length < MAX_PLAYERS) {
             if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
                alert('Questo giocatore è già stato aggiunto.');
                return;
            }
            players.push({ id: Date.now(), name: name }); // Simple unique ID
            playerNameInput.value = ''; // Clear input
            savePlayers();
            renderPlayers();
        } else if (players.length >= MAX_PLAYERS) {
             alert(`Limite di ${MAX_PLAYERS} giocatori raggiunto.`);
        }
    }

    function savePlayers() {
        localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    }

    function loadPlayers() {
        const storedPlayers = localStorage.getItem(STORAGE_KEYS.PLAYERS);
        if (storedPlayers) {
            players = JSON.parse(storedPlayers);
        } else {
            players = [];
        }
        renderPlayers();
    }

     // --- Bracket Management ---

    function populateInitialBracket() {
         if (players.length !== MAX_PLAYERS) {
            alert(`Sono necessari ${MAX_PLAYERS} giocatori per popolare il tabellone.`);
            return;
        }

        const round1Slots = bracketSection.querySelectorAll('.round-1 .player-slot');
        if (round1Slots.length !== MAX_PLAYERS) {
            console.error("Errore: Numero slot nel Round 1 non corrisponde a MAX_PLAYERS.");
            return;
        }

        // Simple sequential population
        players.forEach((player, index) => {
            if (round1Slots[index]) {
                 round1Slots[index].textContent = player.name;
                 // Save this initial population to matches state?
                 // Let's save player names assigned to slots directly
                 matches[round1Slots[index].dataset.playerId] = { name: player.name };
            }
        });

        // Disable editing after population
        // round1Slots.forEach(slot => slot.contentEditable = 'false');
        saveMatches(); // Save the initial player names in slots
        alert('Tabellone iniziale popolato con i giocatori aggiunti.');
    }


    function saveMatchData(matchId, score1, score2, winnerName, loserName) {
        matches[matchId] = {
            score1: score1,
            score2: score2,
            winner: winnerName,
            loser: loserName,
            saved: true
        };
        saveMatches();
    }

     function advanceWinner(winnerName, nextMatchId, nextSlotClass) {
        if (nextMatchId && nextMatchId !== 'winner') {
            const nextMatchElement = document.getElementById(nextMatchId);
            if (nextMatchElement) {
                const nextSlot = nextMatchElement.querySelector(`.player-slot.${nextSlotClass}`);
                if (nextSlot) {
                    nextSlot.textContent = winnerName;
                     // Save the advanced player name
                    matches[nextSlot.dataset.playerId] = { name: winnerName };
                    saveMatches(); // Save after advancing
                } else {
                    console.error(`Slot ${nextSlotClass} non trovato nel match ${nextMatchId}`);
                }
            } else {
                console.error(`Match successivo ${nextMatchId} non trovato.`);
            }
        } else if (nextMatchId === 'winner') {
             // Handle tournament winner
            tournamentWinnerDisplay.textContent = winnerName;
            winnerDisplayCard.style.display = 'block'; // Show the winner card
            // Optionally save the overall winner separately
            matches['tournamentWinner'] = winnerName;
            saveMatches();
        }
    }

    function handleSaveMatchClick(event) {
        const button = event.target;
        const matchElement = button.closest('.match');
        const matchId = button.dataset.matchId;
        const nextMatchId = button.dataset.nextMatch;
        const nextSlotClass = button.dataset.nextSlot;

        const player1Slot = matchElement.querySelector('.player-slot.player1');
        const player2Slot = matchElement.querySelector('.player-slot.player2');
        const score1Input = matchElement.querySelector('.score.score1');
        const score2Input = matchElement.querySelector('.score.score2');

        const player1Name = player1Slot.textContent.trim();
        const player2Name = player2Slot.textContent.trim();
        const score1 = parseInt(score1Input.value, 10);
        const score2 = parseInt(score2Input.value, 10);

        // Basic Validation
        if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
            alert('Inserisci punteggi validi (numeri non negativi).');
            return;
        }
        if (score1 === score2) {
             alert('Il punteggio non può essere un pareggio.');
            return;
        }
         if (!player1Name || !player2Name || player1Name.startsWith('Giocatore') || player1Name.startsWith('Vinc.') || player2Name.startsWith('Giocatore') || player2Name.startsWith('Vinc.')) {
             alert('Assicurati che entrambi gli slot giocatore siano popolati correttamente prima di salvare.');
             return;
         }


        let winnerName, loserName;
        if (score1 > score2) {
            winnerName = player1Name;
            loserName = player2Name;
            player1Slot.classList.add('winner');
            player1Slot.classList.remove('loser');
            player2Slot.classList.add('loser');
            player2Slot.classList.remove('winner');
        } else {
            winnerName = player2Name;
            loserName = player1Name;
            player2Slot.classList.add('winner');
            player2Slot.classList.remove('loser');
            player1Slot.classList.add('loser');
            player1Slot.classList.remove('winner');
        }

        // Save data
        saveMatchData(matchId, score1, score2, winnerName, loserName);

        // Advance winner
        advanceWinner(winnerName, nextMatchId, nextSlotClass);

        // Update UI - disable inputs and button
        score1Input.disabled = true;
        score2Input.disabled = true;
        button.disabled = true;
        button.textContent = 'Salvato';

        // Persist disabled state visually might require storing it or re-applying on load
    }

     function saveMatches() {
        localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    }

    function loadMatches() {
        const storedMatches = localStorage.getItem(STORAGE_KEYS.MATCHES);
        if (storedMatches) {
            matches = JSON.parse(storedMatches);
        } else {
            matches = {};
        }

        // Restore bracket state from saved data
        document.querySelectorAll('.match').forEach(matchElement => {
            const matchId = matchElement.id;
            const matchData = matches[matchId];

            const player1Slot = matchElement.querySelector('.player-slot.player1');
            const player2Slot = matchElement.querySelector('.player-slot.player2');
            const score1Input = matchElement.querySelector('.score.score1');
            const score2Input = matchElement.querySelector('.score.score2');
            const saveButton = matchElement.querySelector('.save-match');

            // Restore player names in slots that aren't the initial round
             if (player1Slot && matches[player1Slot.dataset.playerId]?.name) {
                 player1Slot.textContent = matches[player1Slot.dataset.playerId].name;
             }
             if (player2Slot && matches[player2Slot.dataset.playerId]?.name) {
                 player2Slot.textContent = matches[player2Slot.dataset.playerId].name;
             }


            if (matchData?.saved) {
                 // Restore scores
                score1Input.value = matchData.score1 ?? '';
                score2Input.value = matchData.score2 ?? '';

                 // Restore winner/loser styling
                if (matchData.winner === player1Slot.textContent.trim()) {
                     player1Slot.classList.add('winner');
                     player2Slot.classList.add('loser');
                } else if (matchData.winner === player2Slot.textContent.trim()) {
                    player2Slot.classList.add('winner');
                    player1Slot.classList.add('loser');
                }

                // Restore disabled state
                score1Input.disabled = true;
                score2Input.disabled = true;
                saveButton.disabled = true;
                saveButton.textContent = 'Salvato';

                // We don't need to re-advance winner here, as names in next rounds
                // should be loaded by the slot-specific check above.
            } else {
                 // Ensure fields are enabled if not saved
                 score1Input.disabled = false;
                 score2Input.disabled = false;
                 saveButton.disabled = false;
                 saveButton.textContent = 'Salva Match';
                 player1Slot?.classList.remove('winner', 'loser');
                 player2Slot?.classList.remove('winner', 'loser');
            }
        });

         // Restore overall winner if present
        if (matches['tournamentWinner']) {
            tournamentWinnerDisplay.textContent = matches['tournamentWinner'];
            winnerDisplayCard.style.display = 'block';
        } else {
            winnerDisplayCard.style.display = 'none'; // Hide if no winner yet
        }
    }

    function resetTournament() {
        if (confirm("Sei sicuro di voler resettare TUTTO il torneo? Giocatori e punteggi verranno cancellati.")) {
            // Clear local storage
            localStorage.removeItem(STORAGE_KEYS.PLAYERS);
            localStorage.removeItem(STORAGE_KEYS.MATCHES);

            // Clear current state variables
            players = [];
            matches = {};

            // Clear UI elements
            playerNameInput.value = '';
            playerCardsContainer.innerHTML = '';
            winnerDisplayCard.style.display = 'none';
            tournamentWinnerDisplay.textContent = '-- In attesa --';

            // Reset bracket visuals (clear inputs, names, styles, enable buttons)
             document.querySelectorAll('.match').forEach(matchElement => {
                 const score1Input = matchElement.querySelector('.score.score1');
                 const score2Input = matchElement.querySelector('.score.score2');
                 const saveButton = matchElement.querySelector('.save-match');
                 const playerSlots = matchElement.querySelectorAll('.player-slot');

                 score1Input.value = '';
                 score1Input.disabled = false;
                 score1Input.placeholder = '0';
                 score2Input.value = '';
                 score2Input.disabled = false;
                 score2Input.placeholder = '0';

                 saveButton.disabled = false;
                 saveButton.textContent = 'Salva Match';

                 playerSlots.forEach((slot, index) => {
                    slot.classList.remove('winner', 'loser');
                    // Reset player names based on round
                    const round = slot.closest('.round');
                    if (round.classList.contains('round-1')) {
                         // Reset initial round placeholders (assuming 16 slots)
                         slot.textContent = `Giocatore ${slot.dataset.playerId.match(/r1m(\d)p(\d)/)[1] * 2 - (slot.dataset.playerId.endsWith('p2') ? 0 : 1)}`;
                    } else {
                        // Reset placeholders for later rounds
                        const placeholderMap = {
                            'qf1p1': 'Vinc. R1M1/R1M2', 'qf1p2': 'Vinc. R1M1/R1M2',
                            'qf2p1': 'Vinc. R1M3/R1M4', 'qf2p2': 'Vinc. R1M3/R1M4',
                            'qf3p1': 'Vinc. R1M5/R1M6', 'qf3p2': 'Vinc. R1M5/R1M6',
                            'qf4p1': 'Vinc. R1M7/R1M8', 'qf4p2': 'Vinc. R1M7/R1M8',
                            'sf1p1': 'Vinc. QF1/QF2', 'sf1p2': 'Vinc. QF1/QF2',
                            'sf2p1': 'Vinc. QF3/QF4', 'sf2p2': 'Vinc. QF3/QF4',
                            'fp1': 'Vinc. SF1', 'fp2': 'Vinc. SF2'
                        };
                         slot.textContent = placeholderMap[slot.dataset.playerId] || 'TBD';
                    }
                 });
            });

             // Re-render empty player list and update button states
             renderPlayers();
             alert('Torneo resettato.');
        }
    }


    // --- Initialization ---
    addPlayerForm.addEventListener('submit', addPlayer);
    populateBracketButton.addEventListener('click', populateInitialBracket);
    resetTournamentButton.addEventListener('click', resetTournament);

    // Use event delegation for save buttons for efficiency
    bracketSection.addEventListener('click', (event) => {
        if (event.target.classList.contains('save-match')) {
            handleSaveMatchClick(event);
        }
    });

    // Load existing data on page load
    loadPlayers();
    loadMatches(); // Load matches AFTER setting up the initial HTML structure
});
