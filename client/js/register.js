let registerButton = document.getElementById('registerButt');
registerButton.addEventListener('click', () => {
    let firstName =  document.getElementById("firstnameInput").value;	
    let lastName = document.getElementById("lastnameInput").value;
    let email = document.getElementById("emailInput").value;
    let password = null;
    if (document.getElementById("passwordInput").value != document.getElementById("confirmpassInput").value) {
        alert("Passwords Do Not Match!")
        throw "Passwords Do Not Match!"
    } 
    else {
        password =  document.getElementById("passwordInput").value;	
    }
    let params = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        password: password
    }
    axios.post('http://cloudtype.us-west-2.elasticbeanstalk.com/add/player', params)
    .then(res => {
        console.log(res.data);
        if(res.data == "OK") {
            location.replace("./login.html");
            alert("Successfully signed up. Please check your email for notification!!!");
        }
        else {
            alert(res.data.message);
        }
    })
});