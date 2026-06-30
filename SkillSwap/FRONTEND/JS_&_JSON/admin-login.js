const form=document.getElementById("adminLoginForm");

const username=document.getElementById("username");

const password=document.getElementById("password");

const toggle=document.getElementById("togglePassword");

toggle.addEventListener("click",()=>{

if(password.type==="password"){

password.type="text";

toggle.className="fa-regular fa-eye-slash";

}

else{

password.type="password";

toggle.className="fa-regular fa-eye";

}

});

form.addEventListener("submit",async(e)=>{

e.preventDefault();

document.querySelectorAll(".error").forEach(e=>e.innerHTML="");

let valid=true;

if(username.value.trim()==""){

showError(username,"Username required");

valid=false;

}

if(password.value.length<4){

showError(password,"Invalid Password");

valid=false;

}

if(!valid) return;

const response=await fetch("http://localhost:5000/admin/login",{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

username:username.value,

password:password.value

})

});

const data=await response.json();

if(data.success){

localStorage.setItem("adminLoggedIn","true");

localStorage.setItem("adminName",data.username);

window.location.href="admin.html";

}

else{

alert(data.message);

}

});

function showError(input, message) {
    // Finds the closest container, then finds the error span inside it
    const errorSpan = input.closest('.input-group').querySelector('.error');
    if (errorSpan) {
        errorSpan.innerHTML = message;
    }
}