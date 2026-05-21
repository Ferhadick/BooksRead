// --- CONFIGURATION ---
const GITHUB_USERNAME = "Ferhadick"; 
const REPO_NAME = "BooksRead";
const SECRET_PHRASE = "uisikabolshoyrost";
const SHEET_ID = "13lfY5_GSvR8wK-jfgByz_KDblO3K60lJFg8WPveOM5o";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwFiED_FOb2jkazaae4Jf9eCLq0M1S-hpQh7O4qPUExbrs4KWr03dE6AJ47JG1rqw7h/exec";

let books = [];

// Fetch data seamlessly from public Google Sheet
async function loadBooks() {
    try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
        const response = await fetch(csvUrl);
        const text = await response.text();
        
        // Google returns data wrapped in a function, we slice it out cleanly:
        const json = JSON.parse(text.substring(47, text.length - 2));
        const rows = json.table.rows;
        
        // rows.slice(1) skips the header row (Title/Author) so it doesn't show up as a card!
        books = rows.slice(1).map(row => ({
            title: row.c[0] ? row.c[0].v : '',
            author: row.c[1] ? row.c[1].v : ''
        }));

        renderBooks(books);
    } catch (error) {
        console.error(error);
        document.getElementById('books-grid').innerHTML = `<div class="loading">No books found or setup missing.</div>`;
    }
}

function renderBooks(booksToDisplay) {
    const grid = document.getElementById('books-grid');
    grid.innerHTML = '';

    if (booksToDisplay.length === 0) {
        grid.innerHTML = `<div class="loading">The shelf is empty!</div>`;
        return;
    }

    // Alphabetical layout sorting
    const sorted = [...booksToDisplay].sort((a, b) => a.title.localeCompare(b.title));

    sorted.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            <div class="book-title">${escapeHTML(book.title)}</div>
            <div class="book-author">by ${escapeHTML(book.author)}</div>
        `;
        grid.appendChild(card);
    });
}

// Prevents custom code injection and keeps data safe
function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// Live search filtering 
document.getElementById('search-input').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = books.filter(b => b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term));
    renderBooks(filtered);
});

// Modal UI animations
const modal = document.getElementById('book-modal');
document.getElementById('open-modal-btn').onclick = () => { modal.style.display = 'flex'; document.getElementById('add-book-form').reset(); };
document.querySelector('.close-btn').onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

// Direct Submission Handling via Form Parameters (Bypasses CORS restrictions)
document.getElementById('add-book-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btn = document.getElementById('submit-btn');
    const title = document.getElementById('book-title').value.trim();
    const author = document.getElementById('book-author').value.trim();
    const phrase = document.getElementById('secret-phrase').value.trim();

    btn.disabled = true;
    btn.innerText = "Saving to spreadsheet...";

    // Format the data as standard URL variables to safely bypass browser roadblocks
    const formData = new URLSearchParams();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('phrase', phrase);

    try {
        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        // Give the sheet 2 seconds to receive and process the new row, then close up and refresh the UI list
        setTimeout(() => {
            alert("✨ Book submission sent! Refreshing shelf...");
            modal.style.display = 'none';
            btn.disabled = false;
            btn.innerText = "Save Book Instantly";
            loadBooks();
        }, 2000);

    } catch (error) {
        alert("❌ Error sending data.");
        btn.disabled = false;
        btn.innerText = "Save Book Instantly";
    }
});

// Initial startup call to fill the bookshelf
loadBooks();
