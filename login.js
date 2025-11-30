const LoginModule = (() => {
    const quotes = [
        "Dream big. Work hard.",
        "Too tired to be lazy.",
        "Push yourself, no one else will.",
        "Small steps every day.",
        "Success loves preparation.",
        "So many books, so little time.",
        "Reading is dreaming with open eyes.",
        "Books: my escape from reality.",
        "A room without books is empty.",
        "Life is short. Smile!",
        "Reading gives us someplace to go when we have to stay.",
        "Books are uniquely portable magic.",
        "Between the pages of a book is a lovely place to be.",
        "I see food, I eat it.",
        "Read. Learn. Grow.",
        "Hustle beats talent.",
        "Nap hard, dream big.",
        "Do it with passion.",
        "Hard work pays off.",
        "Stay focused, stay strong."
    ];

    let currentQuoteIndex = 0;

    const initQuotes = () => {
        const quoteEl = document.getElementById('quote');
        if (!quoteEl) return;
        setInterval(() => {
            currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
            quoteEl.textContent = quotes[currentQuoteIndex];
        }, 2000);
    };

    const toggleForm = (form) => {
        const loginForm = document.getElementById("loginform");
        const signupForm = document.getElementById("signup");
        if (!loginForm || !signupForm) return;

        if (form === "signup") {
            loginForm.style.display = "none";
            signupForm.style.display = "block";
        } else {
            signupForm.style.display = "none";
            loginForm.style.display = "block";
        }
    };

    const validatePassword = (password) => {
        const minLength = 8;
        if (password.length < minLength) return "Password must be at least 8 characters.";
        if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
        if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter.";
        if (!/[0-9]/.test(password)) return "Password must contain a number.";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain a special character.";
        return true;
    };

    const handleSignup = (e) => {
        e.preventDefault();
        const fullName = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("signupPassword").value.trim();
        const errorMsg = document.getElementById("errorMsg");

        const passCheck = validatePassword(password);
        if (passCheck !== true) {
            errorMsg.style.color = "#ff4c4c";
            errorMsg.textContent = passCheck;
            return;
        }

        let users = JSON.parse(localStorage.getItem("users")) || [];
        if (users.some(u => u.email === email)) {
            errorMsg.style.color = "#ff4c4c";
            errorMsg.textContent = "Account with this email already exists!";
            return;
        }

        const newUser = { name: fullName, email, password };
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));

        errorMsg.style.color = "green";
        errorMsg.textContent = "Signup successful! Redirecting to login...";

        setTimeout(() => {
            toggleForm("login");
            errorMsg.textContent = "";
        }, 1500);
    };

    const handleLogin = (e) => {
        e.preventDefault();
        const usernameOrEmail = document.getElementById("username").value.trim();
        const password = document.getElementById("loginPassword").value.trim();
        const loginError = document.getElementById("loginError");

        const users = JSON.parse(localStorage.getItem("users")) || [];
        const foundUser = users.find(u => u.email === usernameOrEmail || u.name === usernameOrEmail);

        if (!foundUser) {
            loginError.style.color = "#ff4c4c";
            loginError.textContent = "User not found!";
            return;
        }
        if (foundUser.password !== password) {
            loginError.style.color = "#ff4c4c";
            loginError.textContent = "Incorrect password!";
            return;
        }

        loginError.style.color = "green";
        loginError.textContent = "Login successful! Redirecting...";

        localStorage.setItem("loggedInUser", JSON.stringify(foundUser));

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1200);
    };

    const init = () => {
        toggleForm("login");
        initQuotes();

        const signupForm = document.getElementById("signup");
        const loginForm = document.getElementById("loginform");
        if (signupForm) signupForm.addEventListener("submit", handleSignup);
        if (loginForm) loginForm.addEventListener("submit", handleLogin);

        window.toggleForm = toggleForm;
    };

    return { init };
})();

window.addEventListener("DOMContentLoaded", () => LoginModule.init());
