// --- CONFIGURATION ---
// Change these two variables to match your exact GitHub details!
const GITHUB_USERNAME = "Ferhadick"; 
const REPO_NAME = "leylas-bookshelf";
const SECRET_PHRASE = "uisikabolshoyrost";

let books = [];

// Fetch data from books.json on startup
async function loadBooks() {
    try {
        // We fetch directly from the source file in the repository to avoid caching delays
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/books.json?t=${Date.now()}`);
        if (!response.ok) throw new Error("Could not load database file.");
        books = await response.json();
        renderBooks(books);
    } catch (error) {
        console.error(error);
        document.getElementById('books-grid').innerHTML = `<div class="loading">No books found yet. Add the very first book to get started!</div>`;
        books = [];
    }
}

// Draw the book cards onto the page
function renderBooks(booksToDisplay) {
    const grid = document.getElementById('books-grid');
    grid.innerHTML = '';

    if (booksToDisplay.length === 0) {
        grid.innerHTML = `<div class="loading">No matching books found.</div>`;
        return;
    }

    // Sort books alphabetically by title
    const sortedBooks = [...booksToDisplay].sort((a, b) => a.title.localeCompare(b.title));

    sortedBooks.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            <div class="book-title">${escapeHTML(book.title)}</div>
            <div class="book-author">by ${escapeHTML(book.author)}</div>
        `;
        grid.appendChild(card);
    });
}

// Simple security helper to prevent text injection glitches
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Handle real-time filtering through the search bar
document.getElementById('search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = books.filter(book => 
        book.title.toLowerCase().includes(searchTerm) || 
        book.author.toLowerCase().includes(searchTerm)
    );
    renderBooks(filtered);
});

// --- MODAL & FORM CONTROLS ---
const modal = document.getElementById('book-modal');
document.getElementById('open-modal-btn').onclick = () => {
    modal.style.display = 'flex';
    document.getElementById('github-save-section').classList.add('hidden');
    document.getElementById('add-book-form').reset();
};
document.querySelector('.close-btn').onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

// Handle when Leyla clicks submit
document.getElementById('add-book-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('book-title').value.trim();
    const author = document.getElementById('book-author').value.trim();
    const phraseInput = document.getElementById('secret-phrase').value.trim();

    if (phraseInput !== SECRET_PHRASE) {
        alert("❌ Incorrect secret phrase. Access denied.");
        return;
    }

    // 1. Create the temporary updated book array locally
    const updatedBooks = [...books, { title, author }];

    // 2. Format it cleanly as text so it looks nice in GitHub
    const jsonString = JSON.stringify(updatedBooks, null, 2);

    // 3. Encode it so it passes perfectly through a Web URL parameter
    const encodedJson = encodeURIComponent(jsonString);

    // 4. Generate the magic GitHub edit page URL with the text pre-filled
    const magicGithubUrl = `https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/edit/main/books.json?value=${encodedJson}`;

    // Show the secret save button to Leyla
    const saveSection = document.getElementById('github-save-section');
    const githubLink = document.getElementById('github-link');
    
    githubLink.href = magicGithubUrl;
    saveSection.classList.remove('hidden');
});

// Startup initialization
loadBooks();