let cart = [];
let boughtBooks = [];
try {
    cart = JSON.parse(localStorage.getItem('bookpedia_cart') || '[]');
    boughtBooks = JSON.parse(localStorage.getItem('bookpedia_bought') || '[]');
} catch (e) {
    console.warn("localStorage read failed:", e);
}

const FALLBACK_COVER = "https://via.placeholder.com/220x330?text=No+Cover";

// -------------------- LOAD GENRES --------------------
async function loadGenres() {
    const containers = {
        "fiction": document.getElementById("fiction-row"),
        "non_fiction": document.getElementById("nonfiction-row"),
        "science_fiction": document.getElementById("scifi-row")
    };

    for (const [genre, container] of Object.entries(containers)) {
        if (!container) continue;
        container.innerHTML = "";

        try {
            const response = await fetch(`https://openlibrary.org/subjects/${genre}.json?limit=15`);
            const data = await response.json();

            if (!data.works || !data.works.length) continue;

            data.works.forEach(work => {
                try {
                    createBookCard(work, container);
                } catch (cardErr) {
                    console.error(`Failed to create book card for ${work.title}:`, cardErr);
                }
            });
        } catch (err) {
            console.error(`Failed to load ${genre} works:`, err);
        }
    }
}

// -------------------- CREATE BOOK CARD --------------------
function createBookCard(work, container) {
    const cover = work.cover_i
        ? `https://covers.openlibrary.org/b/id/${work.cover_i}-L.jpg`
        : FALLBACK_COVER;
    const price = (Math.random() * 20 + 12.99).toFixed(2);

    try {
        const div = document.createElement("div");
        div.className = "book-card";
        div.innerHTML = `
            <img class="book-cover" src="${cover}">
            <div class="book-info">
                <div class="book-title">${work.title}</div>
                <div class="book-author">${work.author_name?.[0] || "Unknown"}</div>
                <div class="book-price">$${price}</div>
                <button class="add-to-cart">Add to Cart</button>
            </div>
        `;
        container.appendChild(div);

        div.querySelector(".add-to-cart").onclick = () => {
            try {
                cart.push({
                    key: work.key || Math.random(),
                    title: work.title,
                    author: work.author_name?.[0] || "Unknown",
                    price: parseFloat(price),
                    coverUrl: cover
                });
                localStorage.setItem("bookpedia_cart", JSON.stringify(cart));
                updateCartCount();
                renderCart();
                alert(`Added "${work.title}"`);
            } catch (err) {
                console.error("Failed to add book to cart:", err);
            }
        };
    } catch (err) {
        console.error(`Failed to render book card for ${work.title}:`, err);
    }
}

// -------------------- NAVIGATION --------------------
function showPage(page) {
    const sections = document.querySelectorAll("section");
    sections.forEach(sec => sec.style.display = "none");

    const target = document.getElementById(page);
    if (target) target.style.display = "block";
}

// -------------------- CART --------------------
function updateCartCount() {
    const countEl = document.getElementById("cart-count");
    if (countEl) countEl.textContent = cart.length;
}

function renderCart() {
    const container = document.getElementById("cart-items");
    const totalEl = document.getElementById("cart-total-amount");
    if (!container || !totalEl) return;

    container.innerHTML = "";
    let total = 0;

    cart.forEach((item, idx) => {
        total += item.price;
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <img src="${item.coverUrl}">
            <div>
                <h3>${item.title}</h3>
                <p>${item.author}</p>
                <p>$${item.price.toFixed(2)}</p>
            </div>
            <button class="remove-btn">Remove</button>
        `;
        container.appendChild(div);

        div.querySelector(".remove-btn").onclick = () => {
            cart.splice(idx, 1);
            localStorage.setItem("bookpedia_cart", JSON.stringify(cart));
            updateCartCount();
            renderCart();
        };
    });

    totalEl.textContent = total.toFixed(2);
}

document.getElementById("clear-cart")?.addEventListener("click", () => {
    cart = [];
    localStorage.setItem("bookpedia_cart", JSON.stringify(cart));
    updateCartCount();
    renderCart();
});

// -------------------- LOGIN UI --------------------
function updateLoginUI() {
    try {
        const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
        const loginBtn = document.getElementById("login-btn");
        const logoutBtn = document.getElementById("logout-btn");

        if (loggedInUser) {
            if(loginBtn) loginBtn.style.display = "none";
            if(logoutBtn){
                logoutBtn.style.display = "inline-block";
                logoutBtn.textContent = `Logout (${loggedInUser.name})`;
                logoutBtn.onclick = () => {
                    localStorage.removeItem("loggedInUser");
                    updateLoginUI();
                    alert("Logged out successfully!");
                    window.location.reload();
                };
            }
        } else {
            if(loginBtn) loginBtn.style.display = "inline-block";
            if(logoutBtn) logoutBtn.style.display = "none";
        }
    } catch (err) {
        console.warn("Login UI update failed:", err);
    }
}

// -------------------- SEARCH --------------------
function setupSearch() {
    const input = document.getElementById("search-input");
    const btn = document.getElementById("search-btn");
    btn?.addEventListener("click", async () => {
        const query = input.value.trim();
        if (!query) return;

        const container = document.getElementById("fiction-row");
        container.innerHTML = "Searching...";
        try {
            const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`);
            const data = await res.json();
            container.innerHTML = "";
            if (!data.docs.length) container.textContent = "No results found";
            else data.docs.forEach(work => createBookCard({
                title: work.title,
                author_name: [work.author_name?.[0] || "Unknown"],
                cover_i: work.cover_i,
                key: work.key
            }, container));
        } catch (err) {
            console.error("Search failed:", err);
            container.textContent = "Failed to load search results";
        }
    });
}

// -------------------- NAVIGATION SETUP --------------------
function setupNav() {
    document.querySelectorAll("nav a[href^='#']").forEach(link => {
        link.addEventListener("click", e => {
            const hash = link.getAttribute("href").replace("#", "");
            showPage(hash);
        });
    });

    document.getElementById("cart-btn")?.addEventListener("click", () => showPage("cart"));
}

// -------------------- ONLOAD --------------------
window.onload = () => {
    setupNav();
    setupSearch();
    updateCartCount();
    renderCart();
    updateLoginUI();
    loadGenres();

    const hash = location.hash.replace("#", "") || "home";
    showPage(hash);
};

window.onhashchange = () => {
    const page = location.hash.replace("#", "") || "home";
    showPage(page);
};
