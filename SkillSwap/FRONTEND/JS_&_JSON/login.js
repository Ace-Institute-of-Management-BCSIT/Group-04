const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const toggleLoginPassword = document.getElementById("toggleLoginPassword");

// Safeguard: Check if HTML elements actually exist on the page
if (!loginForm || !loginEmail || !loginPassword) {
    console.error("❌ HTML Element Missing! Check your IDs in login.html:", {
        loginForm: !!loginForm,
        loginEmail: !!loginEmail,
        loginPassword: !!loginPassword
    });
}

// Show / Hide Password Toggle
if (toggleLoginPassword && loginPassword) {
    toggleLoginPassword.addEventListener("click", () => {
        if (loginPassword.type === "password") {
            loginPassword.type = "text";
            toggleLoginPassword.innerHTML = `<i class="fa-regular fa-eye-slash"></i>`;
        } else {
            loginPassword.type = "password";
            toggleLoginPassword.innerHTML = `<i class="fa-regular fa-eye"></i>`;
        }
    });
}

// Login Form Submit Handler
if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        console.log("Form submit triggered. Validating inputs...");

        let valid = true;

        // Clear previous error elements
        document.querySelectorAll(".error").forEach(error => {
            error.innerText = "";
        });

        // FIXED: Modernized Email Pattern Validation to support all modern domain extensions (.online, .tech, etc.)
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!loginEmail.value.match(emailPattern)) {
            showError(loginEmail, "Enter a valid email address");
            valid = false;
        }

        // Password Length Validation
        if (loginPassword.value.trim().length < 6) {
            showError(loginPassword, "Password must be at least 6 characters");
            valid = false;
        }

        if (!valid) return; // Terminate if browser-side validation fails

        // Check if api.js utility is present
        if (!window.api || typeof window.api.login !== "function") {
            console.error("❌ window.api.login is undefined. Verify script load orders.");
            alert("System Error: Connection utility (api.js) failed to load.");
            return;
        }

        try {
            console.log("Contacting authentication server...");
            const data = await window.api.login(loginEmail.value.trim(), loginPassword.value);
            console.log("Server response payload:", data);

            if (data.success) {
                // CRITICAL FIX: Explicitly save the JWT Token so api.js can authenticate requests
                if (data.token) {
                    window.api.token = data.token;
                    console.log("✅ Token successfully registered in localStorage.");
                } else {
                    console.warn("⚠️ Login succeeded but no token was returned by the server.");
                }

                // Set legacy session tracking parameters
                localStorage.setItem("skillSwapLoggedIn", "true");
                localStorage.setItem("skillSwapUserEmail", loginEmail.value.trim());
                
                if (data.user) {
                    localStorage.setItem("skillSwapUserRole", data.user.role || 'skill-seeker');
                    localStorage.setItem("skillSwapUserName", data.user.full_name || loginEmail.value.split('@')[0]);
                }

                alert("Login Successful!");
                window.location.href = "home.html"; // Safe redirect with token loaded
            } else {
                // If backend returns an explicit error (like "Invalid response signature" or "Wrong Password")
                alert(data.message || "Invalid email credentials or password.");
            }
        } catch (error) {
            console.error("Critical Runtime Catch Error:", error);
            alert("Network connection failed. Verify your Node server is running on port 5000.");
        }
    });
}

// FIXED: Resilient Error Rendering Helper that handles multiple types of HTML markup structures
function showError(input, message) {
    if (!input || !input.parentElement) return;
    
    // Looks for a .error class anywhere inside the container parent, or directly next to the input field
    const error = input.parentElement.querySelector(".error") || 
                  input.nextElementSibling || 
                  input.parentElement.nextElementSibling;
                  
    if (error && (error.classList.contains("error") || error.tagName === "SPAN" || error.tagName === "DIV")) {
        error.innerText = message;
    } else {
        alert(message);
    }
}