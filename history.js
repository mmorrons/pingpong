// File: history.js
// Manages the match history page (history.html)

document.addEventListener('DOMContentLoaded', () => {
    console.log("History page script loaded.");

    // --- Constants ---
    const STORAGE_KEY_PLAYERS = 'torneoFisioPlayersList';
    const STORAGE_KEY_MATCHES = 'torneoFisioMatches';
    const DEFAULT_IMAGE = 'images/default_avatar.png'; // Assuming default image path

    // --- DOM Elements ---
    const historyTableBody = document.getElementById('history-table-body');
    const noHistoryMessage = document.getElementById('no-history-message');

    // --- State ---
    let players = [];
    let allMatches = [];

    // --- Helper Functions ---

    function loadData() {
        const storedPlayers = localStorage.getItem(STORAGE_KEY_PLAYERS);
        players = storedPlayers ? JSON.parse(storedPlayers) : [];
        console.log("Players loaded for history:", players.length);

        const storedMatches = localStorage.getItem(STORAGE_KEY_MATCHES);
        // Ensure matches are parsed correctly, default to empty array if null/invalid
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
        console.log("Matches loaded for history:", allMatches.length);
    }

    function getPlayerInfo(playerId) {
        if (playerId === null || playerId === undefined) return { name: 'N/A', color: null };
        if (playerId === 'BYE') return { name: 'BYE', color: null };
        const player = players.find(p => p.id === playerId);
        return player
            ? { name: player.name, color: player.color || null }
            : { name: 'Giocatore Rimosso', color: null };
    }

    // Formats duration from seconds to MM:SS or HH:MM:SS
    function formatDuration(seconds) {
        if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
            return '-';
        }
        if (seconds < 60) {
            return `0:${seconds.toString().padStart(2, '0')}`;
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes < 60) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Renders the match history table
    function renderHistoryTable() {
        historyTableBody.innerHTML = ''; // Clear existing rows
        noHistoryMessage.style.display = 'none'; // Hide message initially

        // Filter for completed matches, excluding BYE vs BYE scenarios if any
        const completedMatches = allMatches.filter(match =>
            match.status === 'completed' &&
            (match.player1Id !== 'BYE' || match.player2Id !== 'BYE') // Exclude BYE vs BYE
        ).sort((a, b) => {
             // Sort primarily by round, then by order within round
             if (a.round !== b.round) return a.round - b.round;
             return a.orderInRound - b.orderInRound;
         });


        if (completedMatches.length === 0) {
            noHistoryMessage.style.display = 'block';
            return;
        }

        completedMatches.forEach(match => {
            const row = document.createElement('tr');

            const p1Info = getPlayerInfo(match.player1Id);
            const p2Info = getPlayerInfo(match.player2Id);
            const winnerInfo = getPlayerInfo(match.winnerId);

            // Determine score display based on format
            let scoreText = '-';
            if (match.player1Id !== 'BYE' && match.player2Id !== 'BYE') { // Only show score if not a BYE win
                 if (match.gameFormat === 'bestOf3') {
                     scoreText = `${match.gamesWon1 !== null ? match.gamesWon1 : 0} - ${match.gamesWon2 !== null ? match.gamesWon2 : 0} (Games)`;
                 } else {
                     scoreText = `${match.score1 !== null ? match.score1 : 0} - ${match.score2 !== null ? match.score2 : 0}`;
                 }
             }


            row.innerHTML = `
                <td class="center-align">${match.round || '-'}</td>
                <td class="${match.winnerId === match.player1Id ? 'winner' : (match.winnerId === match.player2Id ? 'loser' : '')}">
                    <div class="player-name-cell">
                        ${p1Info.color ? `<span class="player-color-swatch-small" style="background-color: ${p1Info.color};"></span>` : ''}
                        <span>${p1Info.name}</span>
                    </div>
                </td>
                <td class="${match.winnerId === match.player2Id ? 'winner' : (match.winnerId === match.player1Id ? 'loser' : '')}">
                     <div class="player-name-cell">
                        ${p2Info.color ? `<span class="player-color-swatch-small" style="background-color: ${p2Info.color};"></span>` : ''}
                        <span>${p2Info.name}</span>
                    </div>
                </td>
                <td class="center-align">${scoreText}</td>
                <td>${winnerInfo.name}</td>
                <td class="center-align">${match.gameFormat === 'bestOf3' ? 'Best of 3' : 'Single'}</td>
                <td class="center-align">${match.targetScore || '-'}</td>
                <td class="center-align">${formatDuration(match.duration)}</td>
            `;
            historyTableBody.appendChild(row);
        });
    }

    // --- Initialisation ---
    loadData();
    renderHistoryTable();

}); // End DOMContentLoaded