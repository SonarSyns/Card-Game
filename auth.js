
const SUPABASE_URL = "https://nqaenjhqvwsrmosrzrfa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_PWaXsQ--vrKTo9DuWyOLnQ_Nd0e6aX4";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

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
    let busy = false;

    function openModal() {
        if (!overlay) return;
        previousFocus = document.activeElement;
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("auth-open");
        window.setTimeout(() => email?.focus(), 80);
    }

    function closeModal() {
        if (!overlay) return;
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("auth-open");
        clearMessage();
        if (previousFocus?.focus) previousFocus.focus();
    }

    function clearMessage() {
        if (message) {
            message.textContent = "";
            message.classList.remove("success");
        }
        [email, password, confirmPassword, username]
            .filter(Boolean)
            .forEach(input => input.removeAttribute("aria-invalid"));
    }

    function showMessage(text, success = false) {
        if (!message) return;
        message.textContent = text;
        message.classList.toggle("success", success);
    }

    function setBusy(value) {
        busy = value;
        if (submit) {
            submit.disabled = value;
            submit.setAttribute("aria-busy", String(value));
        }
    }

    function setMode(nextMode) {
        mode = nextMode === "signup" ? "signup" : "signin";
        const signup = mode === "signup";

        tabs.forEach(tab => {
            const active = tab.dataset.mode === mode;
            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", String(active));
        });

        if (title) {
            title.innerHTML = signup
                ? "Create <span>Account</span>"
                : "Welcome <span>Back</span>";
        }

        if (subtitle) {
            subtitle.textContent = signup
                ? "Create an account to begin your journey."
                : "Enter your details to return to the realm.";
        }

        if (submit) {
            submit.innerHTML = signup
                ? "CREATE ACCOUNT <span>→</span>"
                : "SIGN IN <span>→</span>";
        }

        if (confirmWrap) confirmWrap.hidden = !signup;
        if (usernameWrap) usernameWrap.hidden = !signup;
        if (username) username.required = signup;
        if (confirmPassword) confirmPassword.required = signup;
        if (password) {
            password.autocomplete = signup ? "new-password" : "current-password";
        }

        clearMessage();
    }

    function readableError(error) {
        const text = String(error?.message || "").toLowerCase();

        if (text.includes("user already registered")) {
            return "An account with this email already exists. Try signing in.";
        }
        if (text.includes("invalid login credentials")) {
            return "Incorrect email or password.";
        }
        if (text.includes("email not confirmed")) {
            return "Please confirm your email using the link we sent you.";
        }
        if (text.includes("profiles_username_unique") || text.includes("duplicate key")) {
            return "That nickname is already taken. Choose another one.";
        }
        if (text.includes("failed to fetch") || text.includes("network")) {
            return "Could not connect to the server. Check your internet connection.";
        }

        return error?.message || "Something went wrong. Please try again.";
    }

    async function updateProfileLabel(user) {
        if (!profileLabel) return;

        if (!user) {
            profileLabel.textContent = "Sign In";
            return;
        }

        const { data, error } = await supabaseClient
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .maybeSingle();

        profileLabel.textContent = !error && data?.username
            ? data.username
            : user.user_metadata?.username || user.email?.split("@")[0] || "Account";
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (busy) return;

        clearMessage();

        const emailValue = email?.value.trim() || "";
        const passwordValue = password?.value || "";
        const confirmValue = confirmPassword?.value || "";
        const usernameValue = username?.value.trim() || "";
        let invalid = false;

        if (mode === "signup" && !/^[A-Za-z0-9_]{3,16}$/.test(usernameValue)) {
            username?.setAttribute("aria-invalid", "true");
            showMessage("Nickname must be 3–16 characters: letters, numbers, or underscores.");
            invalid = true;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            email?.setAttribute("aria-invalid", "true");
            if (!invalid) showMessage("Enter a valid email address.");
            invalid = true;
        }

        if (passwordValue.length < 8) {
            password?.setAttribute("aria-invalid", "true");
            if (!invalid) showMessage("Your password must contain at least 8 characters.");
            invalid = true;
        }

        if (mode === "signup" && passwordValue !== confirmValue) {
            confirmPassword?.setAttribute("aria-invalid", "true");
            if (!invalid) showMessage("The passwords do not match.");
            invalid = true;
        }

        if (invalid) return;

        setBusy(true);

        try {
            if (mode === "signup") {
                const { data, error } = await supabaseClient.auth.signUp({
                    email: emailValue,
                    password: passwordValue,
                    options: {
                        data: { username: usernameValue }
                    }
                });

                if (error) throw error;

                if (data.session) {
                    await updateProfileLabel(data.user);
                    showMessage("Account created successfully. Welcome!", true);
                    window.setTimeout(closeModal, 900);
                } else {
                    setMode("signin");
                    if (email) email.value = emailValue;
                    showMessage(
                        "Account created. Check your email for a confirmation link before signing in.",
                        true
                    );
                }
            } else {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: emailValue,
                    password: passwordValue
                });

                if (error) throw error;

                await updateProfileLabel(data.user);
                showMessage("Signed in successfully. Welcome back!", true);
                window.setTimeout(closeModal, 700);
            }
        } catch (error) {
            showMessage(readableError(error));
        } finally {
            setBusy(false);
        }
    }

    async function syncSession() {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) return;
        await updateProfileLabel(data.session?.user || null);
    }

    openButton?.addEventListener("click", event => {
        event.preventDefault();
        openModal();
    });

    closeButton?.addEventListener("click", closeModal);

    overlay?.addEventListener("click", event => {
        if (event.target === overlay) closeModal();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && overlay?.classList.contains("is-open")) {
            closeModal();
        }
    });

    tabs.forEach(tab => {
        tab.addEventListener("click", () => setMode(tab.dataset.mode));
    });

    form?.addEventListener("submit", handleSubmit);

    supabaseClient.auth.onAuthStateChange((_event, session) => {
        window.setTimeout(() => updateProfileLabel(session?.user || null), 0);
    });

    setMode("signin");
    syncSession();
})();
