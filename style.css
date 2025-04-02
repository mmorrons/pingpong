:root {
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    --background-color: #f8f9fa;
    --card-background: #ffffff;
    --text-color: #333;
    --border-color: #dee2e6;
    --winner-color: #28a745;
    --loser-color: #dc3545;
    --hover-color: #e9ecef;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: var(--background-color);
    color: var(--text-color);
    line-height: 1.6;
    padding-bottom: 50px; /* Space for reset button */
}

header {
    background-color: var(--primary-color);
    color: white;
    padding: 1rem 0;
    text-align: center;
    margin-bottom: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.container {
    max-width: 1600px;
    margin: auto;
    padding: 0 1rem;
}

.card {
    background-color: var(--card-background);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
}

h2, h3 {
    color: var(--primary-color);
    margin-bottom: 1rem;
    text-align: center;
}

/* Player Section */
#players-section form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

#players-section input[type="text"] {
    flex-grow: 1;
    padding: 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
}

#players-section button,
.action-button,
.save-match {
    padding: 0.6rem 1rem;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-size: 0.9rem;
}

#players-section button:hover,
.action-button:hover,
.save-match:hover {
    background-color: #0056b3;
}

#playerCardsContainer {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.player-card {
    background-color: var(--hover-color);
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    font-size: 0.9rem;
    border: 1px solid var(--border-color);
}

.danger-button {
    background-color: var(--loser-color);
}
.danger-button:hover {
     background-color: #c82333;
}


/* Bracket Section */
.tournament-bracket {
    display: flex;
    overflow-x: auto; /* Allows horizontal scrolling on small screens */
    padding-bottom: 1rem; /* Space for scrollbar */
    gap: 2rem; /* Spacing between rounds */
    min-height: 400px; /* Ensure rounds have space */
}

.round {
    display: flex;
    flex-direction: column;
    justify-content: space-around; /* Distribute matches vertically */
    flex: 1 0 250px; /* Flex properties for responsiveness */
    gap: 1.5rem; /* Spacing between matches */
}

.match {
    background-color: #fff;
    border: 1px solid var(--border-color);
    border-radius: 5px;
    padding: 10px;
    margin-bottom: 10px; /* Vertical space between matches */
    position: relative;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    transition: box-shadow 0.2s ease;
    display: flex;
    flex-direction: column; /* Stack players and button */
    gap: 5px; /* Space between player rows and button */
}

.match:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}


.match-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
    border-bottom: 1px solid #eee; /* Separator between players */
}
.match-content:last-of-type {
    border-bottom: none;
}


.player-slot {
    flex-grow: 1;
    padding: 5px;
    background-color: #f9f9f9;
    border-radius: 3px;
    font-size: 0.95rem;
    min-height: 30px; /* Ensure slot height */
    line-height: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    /* Remove contenteditable styling */
    /* -webkit-user-modify: read-write-plaintext-only; */
    /* outline: none; */
    /* border: 1px dashed var(--border-color); */ /* Indicate editable only when needed */
}

.player-slot.winner {
    font-weight: bold;
    color: var(--winner-color);
}

.player-slot.loser {
    color: var(--secondary-color);
    text-decoration: line-through;
}


.score {
    width: 45px; /* Smaller width for score */
    padding: 5px;
    text-align: center;
    border: 1px solid var(--border-color);
    border-radius: 3px;
    margin-left: 10px;
    -moz-appearance: textfield; /* Hides arrows in Firefox */
}

/* Hide arrows in Chrome, Safari, Edge */
.score::-webkit-outer-spin-button,
.score::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.match button.save-match {
    margin-top: 8px; /* Space above the button */
    width: 100%; /* Button takes full width of match container */
    font-size: 0.85rem;
}

.match button:disabled {
    background-color: var(--secondary-color);
    cursor: not-allowed;
}

/* Winner Display */
.winner-card {
    margin-top: 2rem;
    padding: 1.5rem;
    text-align: center;
    background-color: var(--winner-color);
    color: white;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.winner-card h3 {
    color: white;
    margin-bottom: 0.5rem;
}

#tournament-winner {
    font-size: 1.5rem;
    font-weight: bold;
}

/* Responsive adjustments (basic) */
@media (max-width: 992px) {
    .tournament-bracket {
        gap: 1.5rem;
    }
    .round {
        flex-basis: 220px; /* Slightly smaller base width */
    }
}

@media (max-width: 768px) {
    h1 {
        font-size: 1.8rem;
    }
    .tournament-bracket {
       /* Scrolling will handle layout */
    }
     .round {
        flex-basis: 200px; /* Even smaller */
        gap: 1rem;
    }
    .match {
        padding: 8px;
    }
    .player-slot, .score, .save-match {
        font-size: 0.8rem;
    }
    .score {
        width: 35px;
    }
}
