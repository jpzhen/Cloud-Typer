let loginButton = document.getElementById('loginButt');
loginButton.addEventListener('click', () => {
    let authenticationData = {
        Username : document.getElementById("inputUsername").value,
        Password : document.getElementById("inputPassword").value
    };
    console.log(authenticationData);
    axios.post('http://cloudtype.us-west-2.elasticbeanstalk.com/login', authenticationData)
    .then(res => {
        if(res.data.status == 200) {
            let user = res.data.name;
            sessionStorage.setItem('name', user);
            location.replace("./home.html");
        }
        else {
            alert("Incorrect Login!!!")
        }
    })
});


