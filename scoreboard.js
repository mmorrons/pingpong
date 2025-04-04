// File: scoreboard.js
// Manages the live match scoring page (scoreboard.html)

document.addEventListener('DOMContentLoaded', () => {
    console.log("Scoreboard page script loaded.");

    // --- Constants ---
    const STORAGE_KEY_PLAYERS = 'torneoFisioPlayersList';
    const STORAGE_KEY_MATCHES = 'torneoFisioMatches';
    const STORAGE_KEY_SETTINGS = 'torneoFisioSettings';
    const STORAGE_KEY_CURRENT_MATCH = 'torneoFisioCurrentMatchId';
    const STORAGE_KEY_MATCH_START_TIME = 'torneoFisioMatchStartTime';
    const DEFAULT_IMAGE = 'images/blank_avatar.png'; // Your blank head icon

    // --- DOM Elements ---
    const matchTitle = document.getElementById('match-title');
    const matchInfo = document.getElementById('match-info');
    const p1Image = document.getElementById('player1-image');
    const p1Name = document.getElementById('player1-name');
    const p1ScoreDisplay = document.getElementById('player1-score');
    const p1GamesWonDisplay = document.getElementById('player1-games-won');
    const p2Image = document.getElementById('player2-image');
    const p2Name = document.getElementById('player2-name');
    const p2ScoreDisplay = document.getElementById('player2-score');
    const p2GamesWonDisplay = document.getElementById('player2-games-won');
    const scoreControls = document.getElementById('scoreboard'); // Parent for event delegation
    const finishButton = document.getElementById('finish-match-button'); // Still exists but might be hidden
    const finishError = document.getElementById('finish-error');
    // *** NEW: Overlay elements ***
    const gameWinOverlay = document.getElementById('game-win-overlay');
    const gameWinnerImage = document.getElementById('game-winner-image');
    const gameWinnerMessage = document.getElementById('game-winner-message');
    const nextGameButton = document.getElementById('next-game-button');
    const matchWinOverlay = document.getElementById('match-win-overlay');
    const matchWinnerImage = document.getElementById('match-winner-image');
    const matchWinnerMessage = document.getElementById('match-winner-message');
    const confirmMatchWinButton = document.getElementById('confirm-match-win-button');


    // --- State ---
    let players = [];
    let matches = [];
    let tournamentSettings = { bracketSize: 16, gameFormat: 'single', targetScore: 11, generated: false };
    let currentMatch = null;
    let player1 = null;
    let player2 = null;
    // Live game state
    let score1 = 0;
    let score2 = 0;
    let gamesWon1 = 0;
    let gamesWon2 = 0;
    let currentGameScores = []; // Stores scores of individual games [[p1s, p2s], ...]
    let currentMatchStartTime = null;
    // *** NEW: Flag to block score updates while overlay is shown ***
    let blockScoreUpdates = false;

    // --- Helper Functions ---
    function loadData() {
        const storedPlayers = localStorage.getItem(STORAGE_KEY_PLAYERS);
        players = storedPlayers ? JSON.parse(storedPlayers) : [];

        const storedMatches = localStorage.getItem(STORAGE_KEY_MATCHES);
        matches = storedMatches ? JSON.parse(storedMatches) : [];

        const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
        const loadedSettings = storedSettings ? JSON.parse(storedSettings) : {};
        tournamentSettings = {
            bracketSize: loadedSettings.bracketSize || 16,
            gameFormat: loadedSettings.gameFormat || 'single',
            targetScore: loadedSettings.targetScore || 11,
            generated: loadedSettings.generated || false
        };
        console.log("Loaded Tournament Settings:", tournamentSettings);

        const currentMatchId = localStorage.getItem(STORAGE_KEY_CURRENT_MATCH);
        currentMatchStartTime = localStorage.getItem(STORAGE_KEY_MATCH_START_TIME);
        if (currentMatchStartTime) currentMatchStartTime = parseInt(currentMatchStartTime, 10);

        if (!currentMatchId) {
            handleLoadError("Errore: Nessuna partita selezionata.");
            return false;
        }

        currentMatch = matches.find(m => m.matchId === currentMatchId);
        if (!currentMatch) {
            handleLoadError("Errore: Dati partita non trovati.");
            return false;
        }

        // Allow editing completed matches, but maybe handle errors for 'pending' or 'bye'
        if (currentMatch.status === 'pending' || currentMatch.status === 'bye') {
             handleLoadError(`Errore: Partita non giocabile (${currentMatch.status}).`);
             return false;
        }
         // If match is 'ready', ensure we have start time
         if (currentMatch.status === 'ready' && !currentMatchStartTime) {
              currentMatchStartTime = Date.now();
              localStorage.setItem(STORAGE_KEY_MATCH_START_TIME, currentMatchStartTime.toString());
              console.log("Match started, time recorded:", currentMatchStartTime);
         }


        player1 = players.find(p => p.id === currentMatch.player1Id);
        player2 = players.find(p => p.id === currentMatch.player2Id);

        // Ensure player objects exist even if removed, use default image
        if (!player1) player1 = { id: currentMatch.player1Id, name: 'Giocatore Rimosso', image: DEFAULT_IMAGE };
        if (!player2) player2 = { id: currentMatch.player2Id, name: 'Giocatore Rimosso', image: DEFAULT_IMAGE };
        // Ensure default image is used if image path is missing
        if (player1 && !player1.image) player1.image = DEFAULT_IMAGE;
        if (player2 && !player2.image) player2.image = DEFAULT_IMAGE;

        return true;
    }

     function handleLoadError(message) {
         matchTitle.textContent = message;
         matchInfo.textContent = '';
         // finishButton.disabled = true; // Overlay handles saving now
         if (scoreControls) {
             scoreControls.style.pointerEvents = 'none';
             scoreControls.style.opacity = '0.5';
         }
         if(p1GamesWonDisplay) p1GamesWonDisplay.style.display = 'none';
         if(p2GamesWonDisplay) p2GamesWonDisplay.style.display = 'none';
         console.error("Load error:", message);
     }

     function updateScoreDisplay() {
        p1ScoreDisplay.textContent = score1;
        p2ScoreDisplay.textContent = score2;
        if (tournamentSettings.gameFormat === 'bestOf3') {
             p1GamesWonDisplay.textContent = `Games: ${gamesWon1}`;
             p2GamesWonDisplay.textContent = `Games: ${gamesWon2}`;
        }
    }

     // Checks if score meets win condition (reach target AND be 2 points ahead)
     function checkWinCondition(s1, s2, target) {
         const p1Wins = s1 >= target && s1 >= s2 + 2;
         const p2Wins = s2 >= target && s2 >= s1 + 2;
         if (p1Wins) return 'p1';
         if (p2Wins) return 'p2';
         return null;
     }


    // --- Event Handlers ---

    function handleScoreButtonClick(event) {
        // *** NEW: Prevent score updates if overlay is showing ***
        if (blockScoreUpdates) {
            console.log("Score update blocked by overlay.");
            return;
        }

        const target = event.target;
        // Check if the clicked element is a score button
        if (!target.classList.contains('score-btn')) return;

        const playerNum = target.dataset.player;
        const isPlus = target.classList.contains('score-plus');
        const isMinus = target.classList.contains('score-minus');

        // Update scores based on which button was clicked
        if (playerNum === '1') {
            if (isPlus) score1++;
            else if (isMinus && score1 > 0) score1--;
        } else if (playerNum === '2') {
            if (isPlus) score2++;
            else if (isMinus && score2 > 0) score2--;
        }

        updateScoreDisplay();
        finishError.textContent = ''; // Clear any previous errors

        // Check if the game or match ended after the score update
        checkGameEnd();
    }

    // *** UPDATED FUNCTION: Check Game End & Show Overlays ***
    function checkGameEnd() {
        // Prevent checking if already blocked (e.g., overlay visible)
        if (blockScoreUpdates) return;

        const targetScore = tournamentSettings.targetScore;
        const gameWinner = checkWinCondition(score1, score2, targetScore);

        if (gameWinner) {
            blockScoreUpdates = true; // Block further score updates immediately
            const winnerPlayer = (gameWinner === 'p1') ? player1 : player2;
            const loserPlayer = (gameWinner === 'p1') ? player2 : player1; // Not used currently, but good to have

            console.log(`Game ended. Winner: ${winnerPlayer.name} (${score1}-${score2})`);

            // Store the finished game's score before potentially resetting for next game
            currentGameScores.push([score1, score2]);
            console.log("Stored game score:", [score1, score2]);

            // Handle Best of 3 logic
            if (tournamentSettings.gameFormat === 'bestOf3') {
                 if (gameWinner === 'p1') gamesWon1++;
                 else gamesWon2++;
                 console.log("Current Games Score:", gamesWon1, "-", gamesWon2);

                 // Check if this game win also wins the match
                 if (gamesWon1 >= 2 || gamesWon2 >= 2) {
                     // Match Won! Show Match Win Overlay
                     console.log(`Match won by ${winnerPlayer.name}`);
                     matchWinnerImage.src = winnerPlayer.image || DEFAULT_IMAGE;
                     matchWinnerImage.alt = winnerPlayer.name;
                     matchWinnerImage.onerror = function() { this.src = DEFAULT_IMAGE; };
                     matchWinnerMessage.textContent = `${winnerPlayer.name} vince il match ${gamesWon1}-${gamesWon2}!`;
                     matchWinOverlay.style.display = 'flex'; // Make visible (CSS handles centering)
                     // Add 'show' class to trigger transition after a tiny delay
                     setTimeout(() => matchWinOverlay.classList.add('show'), 10);
                 } else {
                     // Only Game Won, Show Game Win Overlay
                     console.log(`Game ${gamesWon1 + gamesWon2} won by ${winnerPlayer.name}`);
                     gameWinnerImage.src = winnerPlayer.image || DEFAULT_IMAGE;
                     gameWinnerImage.alt = winnerPlayer.name;
                     gameWinnerImage.onerror = function() { this.src = DEFAULT_IMAGE; };
                     gameWinnerMessage.textContent = `${winnerPlayer.name} vince il game ${gamesWon1 + gamesWon2}! (${score1}-${score2})`;
                     gameWinOverlay.style.display = 'flex';
                      // Add 'show' class to trigger transition
                     setTimeout(() => gameWinOverlay.classList.add('show'), 10);
                     // Score reset will happen when overlay is closed via button
                 }
            } else { // Single game format - Game Win = Match Win
                 // Match Won! Show Match Win Overlay immediately
                 console.log(`Match won by ${winnerPlayer.name} (single game)`);
                 matchWinnerImage.src = winnerPlayer.image || DEFAULT_IMAGE;
                 matchWinnerImage.alt = winnerPlayer.name;
                 matchWinnerImage.onerror = function() { this.src = DEFAULT_IMAGE; };
                 matchWinnerMessage.textContent = `${winnerPlayer.name} vince la partita ${score1}-${score2}!`;
                 matchWinOverlay.style.display = 'flex';
                  // Add 'show' class to trigger transition
                 setTimeout(() => matchWinOverlay.classList.add('show'), 10);
            }
        }
        // No win condition met, do nothing more here.
    }

    // *** NEW: Handler for "Next Game" button in Game Win Overlay ***
    nextGameButton.addEventListener('click', () => {
        console.log("Next game button clicked");
        score1 = 0; // Reset scores for the new game
        score2 = 0;
        gameWinOverlay.classList.remove('show'); // Hide overlay with transition

        // Use setTimeout to allow fade-out animation before resetting display state
        setTimeout(() => {
             gameWinOverlay.style.display = 'none'; // Fully hide after transition
             blockScoreUpdates = false; // Allow score updates again
             updateScoreDisplay(); // Update display with reset scores and NEW game wins count
             // finishButton might still be hidden or disabled depending on overall state
             console.log("Starting next game. Score reset. Score updates enabled.");
        }, 300); // Match this duration to your CSS transition time (or slightly longer)
    });

    // *** NEW: Handler for "Confirm" button in Match Win Overlay ***
    confirmMatchWinButton.addEventListener('click', () => {
         console.log("Confirm match win button clicked");
         matchWinOverlay.classList.remove('show'); // Hide overlay with transition
         // Use setTimeout to allow fade-out animation before proceeding
         setTimeout(() => {
             matchWinOverlay.style.display = 'none'; // Fully hide
             // Proceed to save the match
             handleFinishMatchClick(); // Call the existing save function
         }, 300); // Match this duration to your CSS transition time
    });


    // Handles saving the final match result (called by match win overlay button)
    function handleFinishMatchClick() {
        console.log("Attempting to finish and save match...");
        finishError.textContent = '';

        let finalWinnerId = null;
        let finalScore1 = score1; // Score of the last game played
        let finalScore2 = score2;
        let finalGameScores = currentGameScores; // Use the stored game scores

        // *** Determine winner and final state based on gamesWon or final score check ***
        if (tournamentSettings.gameFormat === 'bestOf3') {
            // Check if the last game's score is actually stored. It should be if checkGameEnd ran.
            const lastStoredGame = finalGameScores[finalGameScores.length - 1];
            // This check might be redundant if checkGameEnd always adds the score before showing overlay
            if (!lastStoredGame || lastStoredGame[0] !== score1 || lastStoredGame[1] !== score2) {
                 console.warn("Last game score might not be stored correctly, adding now:", [score1, score2]);
                 // Only add if it constitutes a valid win, though it should already be determined
                 if(checkWinCondition(score1, score2, tournamentSettings.targetScore)) {
                     finalGameScores.push([score1, score2]);
                 }
            }

            // Determine winner based on games won
            if (gamesWon1 >= 2) finalWinnerId = currentMatch.player1Id;
            else if (gamesWon2 >= 2) finalWinnerId = currentMatch.player2Id;
            else {
                 // This should not happen if called after the match win overlay confirmation
                 console.error("FATAL: Attempted to save match before completion detected.");
                 finishError.textContent = `Errore: Match non concluso (Games: ${gamesWon1}-${gamesWon2}).`;
                 // Re-enable score updates? Or maybe just show error.
                 blockScoreUpdates = false;
                 return;
            }
        } else { // Single Game
            const gameWinner = checkWinCondition(score1, score2, tournamentSettings.targetScore);
            if (gameWinner === 'p1') finalWinnerId = currentMatch.player1Id;
            else if (gameWinner === 'p2') finalWinnerId = currentMatch.player2Id;
            else {
                // This should not happen if called after the match win overlay confirmation
                console.error("FATAL: Attempted to save single game match before completion detected.");
                finishError.textContent = `Errore: Partita non conclusa (Punteggio: ${score1}-${score2}).`;
                blockScoreUpdates = false;
                return;
            }
            // Ensure the single game score is in the array
             if (!Array.isArray(finalGameScores) || finalGameScores.length === 0 || finalGameScores[0][0] !== score1 || finalGameScores[0][1] !== score2) {
                 console.warn("Storing single game score on save:", [score1, score2]);
                 finalGameScores = [[score1, score2]];
             }
        }

        // --- Timing ---
        const matchEndTime = Date.now();
        let matchDuration = null;
        if (currentMatchStartTime && matchEndTime > currentMatchStartTime) {
             matchDuration = Math.round((matchEndTime - currentMatchStartTime) / 1000); // Duration in seconds
             console.log("Match Duration (seconds):", matchDuration);
        } else {
            console.warn("Could not calculate match duration. Start time:", currentMatchStartTime);
        }

        // --- Update Match Object in the 'matches' array ---
        const matchIndex = matches.findIndex(m => m.matchId === currentMatch.matchId);
        if (matchIndex === -1) {
            console.error("FATAL: Cannot find current match in array to update!");
            finishError.textContent = "Errore interno grave: Impossibile salvare.";
            // Might need to re-enable interaction or guide user back
            blockScoreUpdates = false;
            return;
        }

        // Update the match data
        matches[matchIndex] = {
            ...matches[matchIndex],
            score1: finalScore1,      // Score of the *last* game played
            score2: finalScore2,
            gamesWon1: gamesWon1,     // Total games won
            gamesWon2: gamesWon2,
            gameScores: finalGameScores, // Array of individual game scores
            winnerId: finalWinnerId,
            status: 'completed',
            // Ensure settings used are saved with the match data
            gameFormat: tournamentSettings.gameFormat,
            targetScore: tournamentSettings.targetScore,
            startTime: currentMatchStartTime,
            endTime: matchEndTime,
            duration: matchDuration
        };
        console.log("Match object updated:", matches[matchIndex]);

        // --- Advance winner to the next match in the bracket ---
         const nextMatchId = matches[matchIndex].nextMatchId;
         const nextSlotIdentifier = matches[matchIndex].nextSlotIdentifier; // 'p1' or 'p2'

         if (nextMatchId && nextSlotIdentifier) {
             const nextMatchIndex = matches.findIndex(m => m.matchId === nextMatchId);
             if (nextMatchIndex !== -1) {
                 console.log(`Advancing winner ${finalWinnerId} to match ${nextMatchId} slot ${nextSlotIdentifier}`);
                 const targetSlotProperty = (nextSlotIdentifier === 'p1') ? 'player1Id' : 'player2Id';
                 matches[nextMatchIndex][targetSlotProperty] = finalWinnerId;

                 // Re-evaluate the status of the *next* match now that a player has been added
                 const p1IdNext = matches[nextMatchIndex].player1Id;
                 const p2IdNext = matches[nextMatchIndex].player2Id;

                 // Check if the next match is now ready or completed due to BYE
                 if (p1IdNext !== null && p2IdNext !== null) {
                      if (p1IdNext === 'BYE') {
                          matches[nextMatchIndex].winnerId = p2IdNext;
                          matches[nextMatchIndex].status = 'completed';
                      } else if (p2IdNext === 'BYE') {
                           matches[nextMatchIndex].winnerId = p1IdNext;
                           matches[nextMatchIndex].status = 'completed';
                      } else {
                           // Both slots filled with actual players (or previously removed ones)
                           matches[nextMatchIndex].status = 'ready';
                           matches[nextMatchIndex].winnerId = null; // Ensure winner is null if ready
                      }
                 } else {
                     // Still waiting for the other player
                     matches[nextMatchIndex].status = 'pending';
                     matches[nextMatchIndex].winnerId = null;
                 }
                  console.log("Next match status updated:", matches[nextMatchIndex].matchId, matches[nextMatchIndex].status);
             } else {
                 console.warn(`Next match with ID ${nextMatchId} not found for advancement!`);
             }
         } else {
              console.log("This was the final match or no next match defined.");
              // Potentially trigger tournament win logic here if needed, but bracket page handles display
         }


        // --- Save Updated Matches Array and Clean Up ---
        try {
            localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(matches));
            localStorage.removeItem(STORAGE_KEY_CURRENT_MATCH); // Clear current match ID
            localStorage.removeItem(STORAGE_KEY_MATCH_START_TIME); // Clear start time
            console.log("Matches saved to localStorage. Current match/time cleared.");

            // Redirect back to the main bracket page
            alert("Partita salvata con successo! Ritorno al tabellone."); // Optional final confirmation
            window.location.href = 'index.html';

        } catch (error) {
             console.error("Error saving matches to localStorage:", error);
             finishError.textContent = "Errore durante il salvataggio delle partite.";
             // Re-enable interaction?
             blockScoreUpdates = false;
        }
    }


    // --- Initialisation ---
    if (loadData()) {
        // Populate initial display
        matchTitle.textContent = `Partita: ${player1.name} vs ${player2.name}`;
        matchInfo.textContent = `Formato: ${tournamentSettings.gameFormat === 'bestOf3' ? 'Al Meglio dei 3' : 'Partita Singola'}, Target: ${tournamentSettings.targetScore} punti`;

        p1Image.src = player1.image; // Already defaults in loadData
        p1Image.alt = player1.name;
        p1Image.onerror = function() { this.src = DEFAULT_IMAGE; };
        p1Name.textContent = player1.name;

        p2Image.src = player2.image; // Already defaults in loadData
        p2Image.alt = player2.name;
        p2Image.onerror = function() { this.src = DEFAULT_IMAGE; };
        p2Name.textContent = player2.name;

        // Initialize state based on loaded match status (if editing completed match)
        if (currentMatch.status === 'completed') {
            console.log("Loading state for completed match (editing).");
            score1 = currentMatch.score1 !== null ? currentMatch.score1 : 0;
            score2 = currentMatch.score2 !== null ? currentMatch.score2 : 0;
            gamesWon1 = currentMatch.gamesWon1 !== null ? currentMatch.gamesWon1 : 0;
            gamesWon2 = currentMatch.gamesWon2 !== null ? currentMatch.gamesWon2 : 0;
            currentGameScores = Array.isArray(currentMatch.gameScores) ? [...currentMatch.gameScores] : []; // Load game scores if available

             // Show the main finish button immediately if editing a completed match? Or rely on overlay?
             // For consistency, let's rely on triggering the win condition again via score changes.
             // finishButton.textContent = "Aggiorna Partita";
             // finishButton.style.display = 'block';
             // finishButton.onclick = handleFinishMatchClick; // Direct save if editing? Risky.

             // Best practice: Require score change to trigger overlay/save flow again, even when editing.
             finishButton.style.display = 'none'; // Hide direct save button


        } else { // 'ready' status (new match)
            score1 = 0;
            score2 = 0;
            gamesWon1 = 0;
            gamesWon2 = 0;
            currentGameScores = []; // Start with empty game scores
            finishButton.style.display = 'none'; // Hide direct save button
        }

        // Show/hide games won display based on format
        if (tournamentSettings.gameFormat === 'bestOf3') {
             p1GamesWonDisplay.style.display = 'block';
             p2GamesWonDisplay.style.display = 'block';
        } else {
             p1GamesWonDisplay.style.display = 'none';
             p2GamesWonDisplay.style.display = 'none';
        }

        updateScoreDisplay(); // Show initial scores/games

        // Add event listeners
        scoreControls.addEventListener('click', handleScoreButtonClick); // Use delegation on parent
        // Overlay buttons have their own listeners added above

        // Ensure overlays are hidden initially
        gameWinOverlay.style.display = 'none';
        matchWinOverlay.style.display = 'none';
        gameWinOverlay.classList.remove('show');
        matchWinOverlay.classList.remove('show');
        blockScoreUpdates = false; // Ensure scoring is enabled on load

        console.log("Scoreboard initialization complete for match:", currentMatch.matchId);

    } else {
        console.error("Scoreboard initialization failed due to load data error.");
    }

}); // End DOMContentLoaded