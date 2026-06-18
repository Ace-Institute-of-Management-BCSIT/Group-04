const form = document.getElementById("signupForm");
const fullname = document.getElementById("fullname");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const password = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

if (togglePassword && password) {
  togglePassword.addEventListener("click", () => {
    if (password.type === "password") {
      password.type = "text";
      togglePassword.innerHTML = `<i class="fa-regular fa-eye-slash"></i>`;
    } else {
      password.type = "password";
      togglePassword.innerHTML = `<i class="fa-regular fa-eye"></i>`;
    }
  });
}

if (form) {
  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    let valid = true;

    document.querySelectorAll(".error").forEach(el => {
      el.innerText = "";
    });

    if (fullname.value.trim() === "") {
      showError(fullname, "Full name is required");
      valid = false;
    }

    const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
    if (!email.value.match(emailPattern)) {
      showError(email, "Enter valid email address");
      valid = false;
    }

    const phonePattern = /^[0-9]{10}$/;
    if (!phone.value.match(phonePattern)) {
      showError(phone, "Phone number must be 10 digits");
      valid = false;
    }

    if (password.value.length < 6) {
      showError(password, "Password must be at least 6 characters");
      valid = false;
    }

    const role = document.querySelector('input[name="role"]:checked');
    if (!role) {
      const roleErr = document.querySelector(".role-error");
      if (roleErr) roleErr.innerText = "Please select your role";
      valid = false;
    }

    if (!valid) return;

    // Use centralized api.js framework to match registration paths
    if (!window.api || typeof window.api.register !== "function") {
        alert("System Error: API utility (api.js) failed to respond.");
        return;
    }

    try {
        const data = await window.api.register({
            full_name: fullname.value.trim(),
            email: email.value.trim(),
            phone: phone.value.trim(),
            password: password.value,
            role: role.value
        });

        alert(data.message);

        if (data.success || data.message === "Signup Successful") {
            localStorage.setItem('skillSwapUserEmail', email.value.trim());
            localStorage.setItem('skillSwapUserRole', role.value);
            localStorage.setItem('skillSwapUserName', fullname.value.trim());

            window.location.href = "login.html";
        }
    } catch (error) {
        console.error(error);
        alert("Something went wrong during registration.");
    }
  });
}

function showError(input, message) {
  if (!input || !input.parentElement) return;
  const error = input.parentElement.nextElementSibling;
  if (error) {
    error.innerText = message;
  }
}