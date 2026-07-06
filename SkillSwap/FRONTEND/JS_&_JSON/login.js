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

            if (data.requiresVerification) {
                document.getElementById("loginForm").style.display = "none";
                document.getElementById("otpSection").style.display = "block";

                const otpErrorEl = document.getElementById('otpError');
                const demoOtpNotice = document.getElementById('demoOtpNotice');
                const verifyBtn = document.getElementById('verifyOtpBtn');
                const resendBtn = document.getElementById('resendOtpBtn');
                const countdownEl = document.getElementById('resendCountdown');

                if (demoOtpNotice) {
                    demoOtpNotice.innerText = data.otp ? `Demo OTP: ${data.otp}` : '';
                }

                function showOtpError(msg) {
                    if (otpErrorEl) otpErrorEl.innerText = msg || '';
                }

                async function doVerify() {
                    showOtpError('');
                    const otp = document.getElementById("otpInput").value.trim();
                    if (!otp || otp.length < 4) {
                        showOtpError('Enter the 6-digit code');
                        return;
                    }

                    verifyBtn.disabled = true;
                    const result = await window.api.verifyOtp(data.email, otp);
                    verifyBtn.disabled = false;

                    if (result.success) {
                        if (result.token) window.api.token = result.token;
                        localStorage.setItem("skillSwapLoggedIn", "true");
                        localStorage.setItem("skillSwapUserEmail", data.email);
                        if (result.user) {
                            localStorage.setItem("skillSwapUserRole", result.user.role || 'skill-seeker');
                            localStorage.setItem("skillSwapUserName", result.user.full_name || data.email.split('@')[0]);
                        }

                        alert("Login Successful!");
                        window.location.href = "home.html";
                    } else {
                        showOtpError(result.message || 'Invalid code.');
                    }
                }

                verifyBtn.addEventListener('click', doVerify);

                // Resend logic with countdown
                let resendTimer = null;
                const RESEND_INTERVAL = 60; // seconds

                function startResendCountdown(seconds) {
                    let remaining = seconds;
                    resendBtn.disabled = true;
                    countdownEl.innerText = `You can resend in ${remaining}s`;
                    resendTimer = setInterval(() => {
                        remaining -= 1;
                        if (remaining <= 0) {
                            clearInterval(resendTimer);
                            resendBtn.disabled = false;
                            countdownEl.innerText = '';
                        } else {
                            countdownEl.innerText = `You can resend in ${remaining}s`;
                        }
                    }, 1000);
                }

                resendBtn.addEventListener('click', async () => {
                    resendBtn.disabled = true;
                    showOtpError('');
                    const resp = await window.api.resendOtp(data.email);
                    if (resp.success) {
                        startResendCountdown(RESEND_INTERVAL);
                    } else {
                        showOtpError(resp.message || 'Failed to resend code.');
                        resendBtn.disabled = false;
                    }
                });

                // start initial countdown because code was just sent
                startResendCountdown(RESEND_INTERVAL);

                return;
            }

            if (data.success) {
                if (data.token) {
                    window.api.token = data.token;
                    console.log("✅ Token successfully registered in localStorage.");
                } else {
                    console.warn("⚠️ Login succeeded but no token was returned by the server.");
                }

                localStorage.setItem("skillSwapLoggedIn", "true");
                localStorage.setItem("skillSwapUserEmail", loginEmail.value.trim());
                if (data.user) {
                    localStorage.setItem("skillSwapUserRole", data.user.role || 'skill-seeker');
                    localStorage.setItem("skillSwapUserName", data.user.full_name || loginEmail.value.split('@')[0]);
                }

                alert("Login Successful!");
                window.location.href = "home.html";
            } else {
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