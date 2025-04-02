document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const playerNameInput = document.getElementById('player-name-input');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const playerListUl = document.getElementById('player-list');
    const startTournamentBtn = document.getElementById('start-tournament-btn');
    const resetTournamentBtn = document.getElementById('reset-tournament-btn');
    const tournamentBracketSection = document.getElementById('tournament-bracket');
    const scoreboardSection = document.getElementById('scoreboard');
    const scoreboardMatchInfo = document.getElementById('scoreboard-match-info');
    const scoreboardControls = document.getElementById('scoreboard-controls');
    const sbPlayer1Name = document.getElementById('sb-player1-name');
    const sbPlayer1Score = document.getElementById('sb-player1-score');
    const sbPlayer2Name = document.getElementById('sb-player2-name');
    const sbPlayer2Score = document.getElementById('sb-player2-score');
    const saveScoreBtn = document.getElementById('save-score-btn');
    const scoreError = document.getElementById('score-error');
    const tournamentWinnerEl = document.getElementById('tournament-winner');

    // --- State Variables ---
    let players = [];
    let tournamentData = null; // Structure: { rounds: { 'round-of-16': [], 'quarter-finals': [], ... }, currentMatch: null }
    const MAX_PLAYERS = 16;

    // --- Initialization ---
    loadState();
    updateUI();

    // --- Event Listeners ---
    addPlayerBtn.addEventListener('click', addPlayer);
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addPlayer();
        }
    });
    playerListUl.addEventListener('click', handlePlayerListClick);
    startTournamentBtn.addEventListener('click', startTournament);
    resetTournamentBtn.addEventListener('click', resetTournament);
    tournamentBracketSection.addEventListener('click', handleBracketClick);
    scoreboardControls.addEventListener('click', handleScoreboardControls);
    saveScoreBtn.addEventListener('click', saveScore);

    // --- Functions ---

    function loadState() {
        const storedPlayers = localStorage.getItem('pingPongPlayers');
        const storedTournament = localStorage.getItem('pingPongTournament');

        players = storedPlayers ? JSON.parse(storedPlayers) : [];
        tournamentData = storedTournament ? JSON.parse(storedTournament) : null;
    }

    function saveState() {
        localStorage.setItem('pingPongPlayers', JSON.stringify(players));
        localStorage.setItem('pingPongTournament', tournamentData ? JSON.stringify(tournamentData) : null);
    }

    function updateUI() {
        renderPlayerList();
        renderTournamentBracket();
        updateScoreboardView();

        // Show/hide sections
        if (tournamentData) {
            playerManagementSection.classList.add('hidden'); // Or keep visible but disable adding
            tournamentBracketSection.classList.remove('hidden');
            scoreboardSection.classList.remove('hidden');
        } else {
            // playerManagementSection.classList.remove('hidden'); // Ensure it's visible
            tournamentBracketSection.classList.add('hidden');
            scoreboardSection.classList.add('hidden');
            // Enable/disable start button based on player count
            startTournamentBtn.disabled = players.length !== MAX_PLAYERS;
        }
    }

    // --- Player Management ---
    function addPlayer() {
        const name = playerNameInput.value.trim();
        if (name && players.length < MAX_PLAYERS && !players.includes(name)) {
            players.push(name);
            playerNameInput.value = '';
            saveState();
            updateUI();
        } else if (players.includes(name)) {
            alert('Giocatore già presente!');
        } else if (players.length >= MAX_PLAYERS) {
            alert(`Massimo ${MAX_PLAYERS} giocatori consentiti.`);
        }
        playerNameInput.focus();
    }

    function removePlayer(nameToRemove) {
         if (tournamentData) {
            alert("Impossibile rimuovere giocatori dopo l'inizio del torneo.");
            return;
         }
        players = players.filter(player => player !== nameToRemove);
        saveState();
        updateUI();
    }

    function handlePlayerListClick(event) {
        if (event.target.classList.contains('remove-player-btn')) {
            const nameToRemove = event.target.dataset.player;
            removePlayer(nameToRemove);
        }
    }

    function renderPlayerList() {
        playerListUl.innerHTML = '';
        players.forEach(player => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${player}</span>
                <button class="remove-player-btn" data-player="${player}">X</button>
            `;
            // Disable remove button if tournament started
            if (tournamentData) {
                 li.querySelector('button').disabled = true;
                 li.querySelector('button').style.cursor = 'not-allowed';
                 li.querySelector('button').style.opacity = '0.5';
            }
            playerListUl.appendChild(li);
        });
         // Update start button state
         startTournamentBtn.disabled = players.length !== MAX_PLAYERS || !!tournamentData; // Disable if not 16 players OR tournament exists
         document.getElementById('player-management').querySelector('h2').textContent = `Gestione Giocatori (${players.length}/${MAX_PLAYERS})`;
         playerNameInput.disabled = tournamentData || players.length >= MAX_PLAYERS;
         addPlayerBtn.disabled = tournamentData || players.length >= MAX_PLAYERS;
    }

    // --- Tournament Logic ---
    function startTournament() {
        if (players.length !== MAX_PLAYERS) {
            alert(`Sono necessari ${MAX_PLAYERS} giocatori per iniziare.`);
            return;
        }
        if (tournamentData) {
             alert("Il torneo è già iniziato.");
             return;
        }

        // Shuffle players for random seeding (optional but good)
        const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

        tournamentData = {
            rounds: {
                'round-of-16': [],
                'quarter-finals': [],
                'semi-finals': [],
                'final': [],
            },
            currentMatch: null, // { roundId, matchIndex }
            winner: null
        };

        // Setup Round of 16
        for (let i = 0; i < MAX_PLAYERS; i += 2) {
            tournamentData.rounds['round-of-16'].push({
                id: `r16-${i/2}`,
                player1: shuffledPlayers[i],
                player2: shuffledPlayers[i + 1],
                score1: null,
                score2: null,
                winner: null,
                round: 'round-of-16',
                matchIndex: i / 2
            });
        }

        // Setup placeholders for subsequent rounds
        const roundsSetup = [
            { id: 'quarter-finals', count: 8, prefix: 'qf' },
            { id: 'semi-finals', count: 4, prefix: 'sf' },
            { id: 'final', count: 2, prefix: 'f' }
        ];

        roundsSetup.forEach(roundInfo => {
            for (let i = 0; i < roundInfo.count / 2; i++) {
                tournamentData.rounds[roundInfo.id].push({
                    id: `${roundInfo.prefix}-${i}`,
                    player1: null, // Placeholder
                    player2: null, // Placeholder
                    score1: null,
                    score2: null,
                    winner: null,
                    round: roundInfo.id,
                    matchIndex: i
                });
            }
        });

        saveState();
        updateUI();
    }

     function resetTournament() {
        if (confirm("Sei sicuro di voler resettare TUTTO (giocatori e torneo)? L'azione è irreversibile.")) {
            players = [];
            tournamentData = null;
            localStorage.removeItem('pingPongPlayers');
            localStorage.removeItem('pingPongTournament');
            // Reset UI elements explicitly if needed
            playerNameInput.value = '';
            playerNameInput.disabled = false;
            addPlayerBtn.disabled = false;
            playerManagementSection.classList.remove('hidden'); // Ensure player section is visible
            tournamentWinnerEl.textContent = '--';
            updateUI(); // Reloads state (now empty) and redraws
        }
    }

    function renderTournamentBracket() {
        if (!tournamentData) {
            tournamentBracketSection.classList.add('hidden');
            return;
        }

        tournamentBracketSection.classList.remove('hidden');

        Object.keys(tournamentData.rounds).forEach(roundId => {
            const roundElement = document.getElementById(roundId);
            if (!roundElement) {
                console.error(`Element not found for round: ${roundId}`);
                return;
            }
             // Find the container within the round element (skip the H3)
             let matchContainer = roundElement;
             if(roundId !== 'winner-display') { // Winner display doesn't have matches like others
                 const h3 = roundElement.querySelector('h3');
                 roundElement.innerHTML = ''; // Clear previous matches, keep H3 if it exists
                 if (h3) roundElement.appendChild(h3);
             } else {
                 matchContainer = roundElement; // Winner display is the container
             }


            tournamentData.rounds[roundId].forEach((match, index) => {
                const matchElement = createMatchElement(match, roundId, index);
                matchContainer.appendChild(matchElement);
            });
        });

        // Display overall winner
        tournamentWinnerEl.textContent = tournamentData.winner ? tournamentData.winner : '--';
    }

    function createMatchElement(match, roundId, index) {
        const matchDiv = document.createElement('div');
        matchDiv.classList.add('match');
        matchDiv.dataset.roundId = roundId;
        matchDiv.dataset.matchIndex = index;

        const player1Name = match.player1 || 'In attesa...';
        const player2Name = match.player2 || 'In attesa...';
        const score1Text = match.score1 !== null ? match.score1 : '-';
        const score2Text = match.score2 !== null ? match.score2 : '-';

        const player1Class = match.winner === match.player1 ? 'player winner' : 'player';
        const player2Class = match.winner === match.player2 ? 'player winner' : 'player';
        const player1Placeholder = !match.player1 ? ' placeholder' : '';
        const player2Placeholder = !match.player2 ? ' placeholder' : '';


        matchDiv.innerHTML = `
            <div class="${player1Class}${player1Placeholder}">
                <span class="name">${player1Name}</span>
                <span class="score">${score1Text}</span>
            </div>
            <div class="${player2Class}${player2Placeholder}">
                <span class="name">${player2Name}</span>
                <span class="score">${score2Text}</span>
            </div>
        `;

        // Add complete class if winner decided
        if(match.winner) {
            matchDiv.classList.add('match-complete');
        }

        // Add selected class if it's the current match
        if (tournamentData.currentMatch &&
            tournamentData.currentMatch.roundId === roundId &&
            tournamentData.currentMatch.matchIndex === index) {
            matchDiv.classList.add('selected-match');
        }

        // Make match clickable only if players are present and no winner yet
         if (match.player1 && match.player2 && !match.winner) {
             matchDiv.style.cursor = 'pointer';
         } else {
             matchDiv.style.cursor = 'default';
             // Remove hover effect if not clickable
             matchDiv.classList.add('no-hover');
         }


        return matchDiv;
    }

    function handleBracketClick(event) {
        const matchElement = event.target.closest('.match');
        if (matchElement && !matchElement.classList.contains('match-complete')) {
            const roundId = matchElement.dataset.roundId;
            const matchIndex = parseInt(matchElement.dataset.matchIndex, 10);
            const matchData = tournamentData.rounds[roundId][matchIndex];

            // Only allow selection if both players are set
             if (!matchData.player1 || !matchData.player2) {
                clearScoreboardSelection();
                 return; // Don't select matches waiting for players
             }

            tournamentData.currentMatch = { roundId, matchIndex };
            saveState(); // Save the selected match
            updateScoreboardView();
             // Update visual selection in bracket
            document.querySelectorAll('.match.selected-match').forEach(el => el.classList.remove('selected-match'));
            matchElement.classList.add('selected-match');
        } else {
             // Clicked outside a selectable match, potentially clear scoreboard
             // Optional: clear selection if clicking background? Decide based on UX preference.
             // clearScoreboardSelection(); // Uncomment to clear selection on background click
        }
    }

    // --- Scoreboard Logic ---

     function clearScoreboardSelection() {
        tournamentData.currentMatch = null;
        saveState();
        updateScoreboardView();
        document.querySelectorAll('.match.selected-match').forEach(el => el.classList.remove('selected-match'));
     }

    function updateScoreboardView() {
        if (tournamentData && tournamentData.currentMatch) {
            const { roundId, matchIndex } = tournamentData.currentMatch;
            const match = tournamentData.rounds[roundId][matchIndex];

            if (match && match.player1 && match.player2) { // Check if players are actually set
                 scoreboardMatchInfo.classList.add('hidden');
                 scoreboardControls.classList.remove('hidden');

                 sbPlayer1Name.textContent = match.player1;
                 sbPlayer2Name.textContent = match.player2;
                 // Use current scores if editing, otherwise default to 0
                 sbPlayer1Score.textContent = match.score1 !== null ? match.score1 : 0;
                 sbPlayer2Score.textContent = match.score2 !== null ? match.score2 : 0;
                 scoreError.textContent = ''; // Clear previous errors
            } else {
                 // Match selected but players not ready (shouldn't happen with click logic, but safe)
                 scoreboardMatchInfo.textContent = "Partita selezionata in attesa di giocatori.";
                 scoreboardMatchInfo.classList.remove('hidden');
                 scoreboardControls.classList.add('hidden');
            }

        } else {
            // No match selected
            scoreboardMatchInfo.textContent = "Seleziona una partita dal tabellone per inserire i punteggi.";
            scoreboardMatchInfo.classList.remove('hidden');
            scoreboardControls.classList.add('hidden');
             // Clear any lingering visual selection
             document.querySelectorAll('.match.selected-match').forEach(el => el.classList.remove('selected-match'));
        }
    }

    function handleScoreboardControls(event) {
        if (!event.target.classList.contains('score-btn')) return;
        if (!tournamentData || !tournamentData.currentMatch) return; // Safety check

        const button = event.target;
        const playerIndex = button.dataset.player; // '1' or '2'
        const isIncrement = button.classList.contains('plus');
        const scoreElement = document.getElementById(`sb-player${playerIndex}-score`);

        let currentScore = parseInt(scoreElement.textContent, 10);

        if (isIncrement) {
            currentScore++;
        } else {
            currentScore = Math.max(0, currentScore - 1); // Score cannot go below 0
        }

        scoreElement.textContent = currentScore;
        scoreError.textContent = ''; // Clear error on score change
    }

    function saveScore() {
        if (!tournamentData || !tournamentData.currentMatch) {
             scoreError.textContent = "Nessuna partita selezionata.";
             return;
        }

        const score1 = parseInt(sbPlayer1Score.textContent, 10);
        const score2 = parseInt(sbPlayer2Score.textContent, 10);

        // Basic validation: Scores must be different for a winner
        if (score1 === score2) {
             scoreError.textContent = "Il punteggio finale non può essere un pareggio.";
             return;
        }
         // Basic validation: Ensure scores are not negative (already handled by buttons, but good practice)
         if (score1 < 0 || score2 < 0) {
             scoreError.textContent = "Il punteggio non può essere negativo.";
             return;
         }

        scoreError.textContent = ''; // Clear error

        const { roundId, matchIndex } = tournamentData.currentMatch;
        const match = tournamentData.rounds[roundId][matchIndex];

        match.score1 = score1;
        match.score2 = score2;
        match.winner = score1 > score2 ? match.player1 : match.player2;

        // Advance winner to the next round
        advanceWinner(match.winner, roundId, matchIndex);

        // Check for tournament completion
         if (roundId === 'final' && match.winner) {
             tournamentData.winner = match.winner;
             alert(`🎉 ${match.winner} ha vinto il torneo! 🎉`);
         }

        // Clear current match selection after saving
        tournamentData.currentMatch = null;

        saveState();
        updateUI(); // Redraw everything
    }

    function advanceWinner(winnerName, sourceRoundId, sourceMatchIndex) {
         let targetRoundId = null;
         let targetMatchIndex = -1;
         let targetPlayerSlot = -1; // 1 or 2

         switch (sourceRoundId) {
             case 'round-of-16':
                 targetRoundId = 'quarter-finals';
                 targetMatchIndex = Math.floor(sourceMatchIndex / 2);
                 targetPlayerSlot = sourceMatchIndex % 2 === 0 ? 1 : 2; // 0->P1, 1->P2, 2->P1, 3->P2 etc.
                 break;
             case 'quarter-finals':
                 targetRoundId = 'semi-finals';
                 targetMatchIndex = Math.floor(sourceMatchIndex / 2);
                 targetPlayerSlot = sourceMatchIndex % 2 === 0 ? 1 : 2;
                 break;
             case 'semi-finals':
                 targetRoundId = 'final';
                 targetMatchIndex = Math.floor(sourceMatchIndex / 2);
                 targetPlayerSlot = sourceMatchIndex % 2 === 0 ? 1 : 2;
                 break;
             case 'final':
                 // Winner decided, no next round
                 tournamentData.winner = winnerName;
                 return; // Exit function
         }

        if (targetRoundId && targetMatchIndex !== -1 && targetPlayerSlot !== -1) {
             const targetMatch = tournamentData.rounds[targetRoundId][targetMatchIndex];
             if(targetMatch) { // Ensure target match exists
                 if (targetPlayerSlot === 1) {
                     targetMatch.player1 = winnerName;
                 } else {
                     targetMatch.player2 = winnerName;
                 }
             } else {
                 console.error(`Target match not found: ${targetRoundId}[${targetMatchIndex}]`);
             }
         } else if (sourceRoundId !== 'final') { // Don't log error for final round
             console.error(`Could not determine next round placement for winner of ${sourceRoundId}[${sourceMatchIndex}]`);
         }
     }

    // Make player management section accesssible for easier debugging / initial setup
    const playerManagementSection = document.getElementById('player-management');


}); // End DOMContentLoaded
