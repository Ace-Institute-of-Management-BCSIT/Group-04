const form = document.getElementById("adminLoginForm");
const username = document.getElementById("username");
const password = document.getElementById("password");
const toggle = document.getElementById("togglePassword");

toggle.addEventListener("click", () => {
    if (password.type === "password") {
        password.type = "text";
        toggle.className = "fa-regular fa-eye-slash";
    } else {
        password.type = "password";
        toggle.className = "fa-regular fa-eye";
    }
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    document.querySelectorAll(".error").forEach(el => el.innerHTML = "");

    let valid = true;

    if (username.value.trim() === "") {
        showError(username, "Username required");
        valid = false;
    }

    if (password.value.length < 4) {
        showError(password, "Invalid Password");
        valid = false;
    }

    if (!valid) return;

    try {
        const response = await fetch("/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: username.value.trim(),
                password: password.value
            })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem("adminToken", data.token);
            localStorage.setItem("adminName", data.username);
            window.location.href = "admin-dashboard.html";
        } else {
            alert(data.message || "Login failed");
        }
    } catch (err) {
        console.error("Admin login error:", err);
        alert("Network error. Verify your server is running on port 5000.");
    }
});

function showError(input, message) {
    // Finds the closest container, then finds the error span inside it
    const errorSpan = input.closest('.input-group').querySelector('.error');
    if (errorSpan) {
        errorSpan.innerHTML = message;
    }
}

// If already logged in, skip straight to the dashboard
if (localStorage.getItem("adminToken")) {
    window.location.href = "admin-dashboard.html";
}
 