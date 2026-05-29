const loginForm = document.getElementById("loginForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const toggleLoginPassword =
document.getElementById("toggleLoginPassword");

toggleLoginPassword.addEventListener("click", () => {

  if(loginPassword.type === "password"){

    loginPassword.type = "text";

    toggleLoginPassword.innerHTML =
    `<i class="fa-regular fa-eye-slash"></i>`;
  }

  else{

    loginPassword.type = "password";

    toggleLoginPassword.innerHTML =
    `<i class="fa-regular fa-eye"></i>`;
  }

});

loginForm.addEventListener("submit", function(e){

  e.preventDefault();

  let valid = true;

  document.querySelectorAll(".error").forEach(el => {
    el.innerText = "";
  });

  const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;

  if(!loginEmail.value.match(emailPattern)){

    showError(loginEmail,"Enter valid email");

    valid = false;
  }

  if(loginPassword.value.length < 6){

    showError(loginPassword,
    "Password must be at least 6 characters");

    valid = false;
  }

  if(valid){

    alert("Login Successful!");

    window.location.href = "home.html";
  }

});

function showError(input,message){

  const error = input.parentElement.nextElementSibling;

  error.innerText = message;
}