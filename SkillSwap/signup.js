const form = document.getElementById("signupForm");

const fullname = document.getElementById("fullname");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const password = document.getElementById("password");

const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", () => {

  if(password.type === "password"){
    password.type = "text";
    togglePassword.innerHTML = `<i class="fa-regular fa-eye-slash"></i>`;
  }
  else{
    password.type = "password";
    togglePassword.innerHTML = `<i class="fa-regular fa-eye"></i>`;
  }

});

form.addEventListener("submit", function(e){

  e.preventDefault();

  let valid = true;

  document.querySelectorAll(".error").forEach(el => {
    el.innerText = "";
  });

  // Full Name
  if(fullname.value.trim() === ""){
    showError(fullname, "Full name is required");
    valid = false;
  }

  // Email
  const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;

  if(!email.value.match(emailPattern)){
    showError(email, "Enter valid email address");
    valid = false;
  }

  // Phone
  const phonePattern = /^[0-9]{10}$/;

  if(!phone.value.match(phonePattern)){
    showError(phone, "Phone number must be 10 digits");
    valid = false;
  }

  // Password
  if(password.value.length < 6){
    showError(password, "Password must be at least 6 characters");
    valid = false;
  }

  // Role
  const role = document.querySelector('input[name="role"]:checked');

  if(!role){
    document.querySelector(".role-error").innerText =
    "Please select your role";

    valid = false;
  }

  if(valid){

    alert("Account Created Successfully!");

    window.location.href = "login.html";
  }

});

function showError(input,message){

  const error = input.parentElement.nextElementSibling;

  error.innerText = message;
}