(() => {
    const overlay = document.getElementById("auth-overlay");
    const openButton = document.getElementById("open-auth");
    const closeButton = document.getElementById("close-auth");
    const form = document.getElementById("auth-form");
    const tabs = [...document.querySelectorAll(".auth-tab")];
    const title = document.getElementById("auth-title");
    const subtitle = document.getElementById("auth-subtitle");
    const submit = document.getElementById("auth-submit");
    const message = document.getElementById("auth-message");
    const email = document.getElementById("auth-email");
    const password = document.getElementById("auth-password");
    const confirmWrap = document.getElementById("confirm-wrap");
    const confirmPassword = document.getElementById("auth-confirm");
    const usernameWrap = document.getElementById("username-wrap");
    const username = document.getElementById("auth-username");
    const profileLabel = document.getElementById("profile-label");
    let mode = "signin";
    let previousFocus = null;

    function openModal() {
        previousFocus = document.activeElement;
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("auth-open");
        window.setTimeout(() => email.focus(), 80);
    }

    function closeModal() {
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("auth-open");
        clearMessage();
        if (previousFocus) previousFocus.focus();
    }

    function clearMessage() {
        message.textContent = "";
        message.classList.remove("success");
        [email, password, confirmPassword, username].forEach(input => input.removeAttribute("aria-invalid"));
    }

    function setMode(nextMode) {
        mode = nextMode;
        const signup = mode === "signup";
        tabs.forEach(tab => {
            const active = tab.dataset.mode === mode;
            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", String(active));
        });
        title.innerHTML = signup ? 'Create <span>Account</span>' : 'Welcome <span>Back</span>';
        subtitle.textContent = signup
            ? "Create an account to begin your journey."
            : "Enter your details to return to the realm.";
        submit.innerHTML = signup ? 'CREATE ACCOUNT <span>→</span>' : 'SIGN IN <span>→</span>';
        confirmWrap.hidden = !signup;
        usernameWrap.hidden = !signup;
        username.required = signup;
        confirmPassword.required = signup;
        password.autocomplete = signup ? "new-password" : "current-password";
        clearMessage();
    }

    openButton.addEventListener("click", event => {
        event.preventDefault();
        openModal();
    });
    closeButton.addEventListener("click", closeModal);
    overlay.addEventListener("click", event => {
        if (event.target === overlay) closeModal();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && overlay.classList.contains("is-open")) closeModal();
    });
    tabs.forEach(tab => tab.addEventListener("click", () => setMode(tab.dataset.mode)));

    form.addEventListener("submit", event => {
        event.preventDefault();
        clearMessage();

        const emailValue = email.value.trim();
        const passwordValue = password.value;
        const confirmValue = confirmPassword.value;
        const usernameValue = username.value.trim();
        let invalid = false;

        if (mode === "signup" && !/^[A-Za-z0-9_]{3,16}$/.test(usernameValue)) {
            username.setAttribute("aria-invalid", "true");
            invalid = true;
            message.textContent = "Choose a nickname of 3–16 characters using letters, numbers, or underscores.";
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            email.setAttribute("aria-invalid", "true");
            invalid = true;
        }
        if (passwordValue.length < 8) {
            password.setAttribute("aria-invalid", "true");
            invalid = true;
            if (!message.textContent) message.textContent = "Your password must contain at least 8 characters.";
        }
        if (mode === "signup" && passwordValue !== confirmValue) {
            confirmPassword.setAttribute("aria-invalid", "true");
            invalid = true;
            if (!message.textContent) message.textContent = "The passwords do not match.";
        }
        if (invalid) {
            if (!message.textContent) message.textContent = "Please check the highlighted fields.";
            return;
        }

        message.textContent = "The form is ready. Supabase authentication has not been connected yet.";
        message.classList.add("success");
    });

    // Authentication is currently UI-only. Supabase will be connected in the next step.
    profileLabel.textContent = "Sign In";
})();
