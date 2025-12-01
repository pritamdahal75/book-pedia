let cart = [];
let boughtBooks = [];
try {
    cart = JSON.parse(localStorage.getItem('bookpedia_cart') || '[]');
    boughtBooks = JSON.parse(localStorage.getItem('bookpedia_bought') || '[]');
} catch (e) { }

const FALLBACK_COVER = "https://via.placeholder.com/220x330?text=No+Cover";

function addToCart(book) {
    cart.push(book);
    localStorage.setItem("bookpedia_cart", JSON.stringify(cart));
    updateCartCount();
    renderCart();
    updateBuyNowButton();
    alert(`Added "${book.title}"`);
}

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
            data.works.forEach(work => createBookCard({
                title: work.title,
                author_name: work.authors?.map(a => a.name) || ["Unknown"],
                cover_i: work.cover_id || work.cover_i,
                key: work.key
            }, container));
        } catch { }
    }
}

function createBookCard(work, container) {
    const cover = work.cover_i
        ? `https://covers.openlibrary.org/b/id/${work.cover_i}-L.jpg`
        : FALLBACK_COVER;

    const price = (Math.random() * 20 + 12.99).toFixed(2);
    const author = work.author_name?.[0] || "Unknown";

    const bookObj = {
        key: work.key,
        title: work.title,
        author: author,
        price: parseFloat(price),
        coverUrl: cover
    };

    const div = document.createElement("div");
    div.className = "book-card";
    div.innerHTML = `
        <img class="book-cover" src="${cover}">
        <div class="book-info">
            <div class="book-title">${work.title}</div>
            <div class="book-author">${author}</div>
            <div class="book-price">$${price}</div>
            <button class="add-to-cart">Add to Cart</button>
        </div>
    `;
    container.appendChild(div);

    div.querySelector(".add-to-cart").onclick = (e) => {
        e.stopPropagation();
        addToCart(bookObj);
    };

    div.addEventListener("click", () => loadBookDetails(bookObj));
}

async function loadBookDetails(book) {
    showPage("book-details");

    document.getElementById("details-cover").innerHTML = `<img src="${book.coverUrl}" style="width:220px;height:330px;">`;
    document.getElementById("details-title").textContent = book.title;
    document.getElementById("details-author").textContent = book.author;
    document.getElementById("details-price").textContent = "$" + book.price;

    try {
        const res = await fetch(`https://openlibrary.org${book.key}.json`);
        const data = await res.json();
        document.getElementById("details-description").textContent =
            data.description?.value || data.description || "No description available.";
    } catch {
        document.getElementById("details-description").textContent = "No description available.";
    }

    document.getElementById("details-add-cart").onclick = () => addToCart(book);
}

document.getElementById("back-btn").onclick = () => {
    showPage("browse");
};

function showPage(page) {
    document.querySelectorAll("section").forEach(sec => sec.style.display = "none");
    const target = document.getElementById(page);
    if (target) target.style.display = "block";
    const searchBar = document.querySelector(".search-bar");
    if (searchBar) {
        if (page === "browse") {
            searchBar.style.display = "flex";
        } else {
            searchBar.style.display = "none";
        }
    }
}

function updateCartCount() {
    const countEl = document.getElementById("cart-count");
    const mobileCountEl = document.getElementById("mobile-cart-count");
    
    if (countEl) countEl.textContent = cart.length;
    if (mobileCountEl) mobileCountEl.textContent = cart.length;
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
            updateBuyNowButton();
        };
    });

    totalEl.textContent = total.toFixed(2);
}

document.getElementById("clear-cart")?.addEventListener("click", () => {
    cart = [];
    localStorage.setItem("bookpedia_cart", JSON.stringify(cart));
    updateCartCount();
    renderCart();
    updateBuyNowButton();
});

function updateLoginUI() {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");

    if (loggedInUser) {
        if (loginBtn) loginBtn.style.display = "none";
        if (logoutBtn) {
            logoutBtn.style.display = "inline-block";
            logoutBtn.textContent = `Logout (${loggedInUser.name})`;
            logoutBtn.onclick = () => {
                localStorage.removeItem("loggedInUser");
                updateLoginUI();
                updateBuyNowButton();
                alert("Logged out successfully!");
            };
        }
    } else {
        if (loginBtn) loginBtn.style.display = "inline-block";
        if (logoutBtn) logoutBtn.style.display = "none";
    }
    updateBuyNowButton();
}

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
                author_name: work.author_name || ["Unknown"],
                cover_i: work.cover_i,
                key: work.key
            }, container));
        } catch {
            container.textContent = "Failed to load search results";
        }
    });
}

function setupNav() {
    document.querySelectorAll("nav a[href^='#']").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const page = link.getAttribute("href").replace("#", "");
            showPage(page);
            window.location.hash = page;
        });
    });
    document.getElementById("cart-btn")?.addEventListener("click", () => {
        showPage("cart");
        window.location.hash = "cart";
    });
}

const buyNowBtn = document.getElementById("buy-now");

function updateBuyNowButton() {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    buyNowBtn.disabled = !loggedInUser || cart.length === 0;
}

buyNowBtn.addEventListener("click", () => {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!loggedInUser) {
        alert("Please login to make a purchase.");
        window.location.href = "login.html";
        return;
    }

    if (cart.length === 0) return;

    const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
    const confirmPurchase = confirm(`Confirm purchase of ${cart.length} book(s) for $${totalAmount.toFixed(2)}?`);

    if (confirmPurchase) {
        boughtBooks.push(...cart);
        cart = [];
        localStorage.setItem("bookpedia_cart", JSON.stringify(cart));
        localStorage.setItem("bookpedia_bought", JSON.stringify(boughtBooks));
        updateCartCount();
        renderCart();
        updateBuyNowButton();
        alert(`Purchase successful! Total: $${totalAmount.toFixed(2)}`);
    } else {
        alert("Purchase canceled.");
    }
});
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');

function toggleMobileMenu() {
    const isActive = mobileMenu.classList.contains('active');
    
    if (isActive) {
        mobileMenu.classList.remove('active');
        hamburgerBtn.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        hamburgerBtn.setAttribute('aria-label', 'Open menu');
        document.body.style.overflow = '';
        setTimeout(() => hamburgerBtn.focus(), 100);
    } else {
        mobileMenu.classList.add('active');
        hamburgerBtn.classList.add('active');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        hamburgerBtn.setAttribute('aria-label', 'Close menu');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            const firstLink = mobileMenu.querySelector('.mobile-nav-link');
            if (firstLink) firstLink.focus();
        }, 300);
    }
}

hamburgerBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileMenu();
});

mobileMenu?.addEventListener('click', (e) => {
    if (e.target === mobileMenu) toggleMobileMenu();
});

document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('active') &&
        !hamburgerBtn.contains(e.target) &&
        !mobileMenu.contains(e.target)) {
        toggleMobileMenu();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        toggleMobileMenu();
    }
});

document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
        setTimeout(toggleMobileMenu, 100);
    });
});

document.getElementById('mobile-cart-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    showPage("cart");
    window.location.hash = "cart";
    toggleMobileMenu();
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && mobileMenu.classList.contains('active')) {
        toggleMobileMenu();
    }
});

window.onload = () => {
    if (hamburgerBtn) {
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        hamburgerBtn.setAttribute('aria-label', 'Open menu');
    }
    
    setupNav();
    setupSearch();
    updateCartCount();
    renderCart();
    updateLoginUI();
    loadGenres();
    
    const initialPage = location.hash.replace("#", "") || "home";
    showPage(initialPage);
};

window.onhashchange = () => {
    const page = location.hash.replace("#", "") || "home";
    showPage(page);
};
