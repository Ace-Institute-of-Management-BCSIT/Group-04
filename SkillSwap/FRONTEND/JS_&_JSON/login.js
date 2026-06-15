const loginForm = document.getElementById("loginForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const toggleLoginPassword =
document.getElementById("toggleLoginPassword");

// Show / Hide Password
toggleLoginPassword.addEventListener("click", () => {

    if (loginPassword.type === "password") {

        loginPassword.type = "text";

        toggleLoginPassword.innerHTML =
        `<i class="fa-regular fa-eye-slash"></i>`;

    } else {

        loginPassword.type = "password";

        toggleLoginPassword.innerHTML =
        `<i class="fa-regular fa-eye"></i>`;
    }
});

// Login Form Submit
loginForm.addEventListener("submit", function (e) {

    e.preventDefault();

    let valid = true;

    // Clear previous errors
    document.querySelectorAll(".error").forEach(error => {
        error.innerText = "";
    });

    // Email Validation
    const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;

    if (!loginEmail.value.match(emailPattern)) {

        showError(loginEmail, "Enter a valid email address");
        valid = false;
    }

    // Password Validation
    if (loginPassword.value.trim().length < 6) {

        showError(
            loginPassword,
            "Password must be at least 6 characters"
        );

        valid = false;
    }

    // Stop if validation fails
    if (!valid) {
        return;
    }

    // Send Login Request
    fetch("http://localhost:5000/login", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            email: loginEmail.value,
            password: loginPassword.value
        })

    })
    .then(response => response.json())
    .then(data => {

        console.log(data);

        if (data.success) {

            alert("Login Successful!");

            localStorage.setItem("skillSwapLoggedIn", "true");
            localStorage.setItem("skillSwapUserEmail", loginEmail.value.trim());

            // Redirect to Home Page
            window.location.href = "home.html";

        } else {

            alert(data.message);
        }
    })
    .catch(error => {

        console.error(error);

        alert("Server Error");
    });
});

// Error Function
function showError(input, message) {

    const error =
    input.parentElement.nextElementSibling;

    error.innerText = message;
}