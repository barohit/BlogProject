function validate() {
    let username = document.getElementsByName('user')[0].value;
    if (username === null) {
        alert("Error, username cannot be empty")
        return false; 
    } else {
        let password = document.getElementsByName("pass")[0].value;
        let confirmpassword = document.getElementsByName("confirmpass")[0].value;
        if (password === null || confirmpassword === null) {
            alert("Error, password fields cannot be empty");
            return false; 
        } else if (password !== confirmpassword) {
            alert("Error, passwords do not match");
            return false; 
        } else {
            return true; 
        }
    }
}

function createBlog() {
    document.getElementsByName("reveal")[0].style = "visibility:visible";
    document.getElementById("blogbutton").style="visibility:hidden";
    document.getElementsByName("Date")[0].value= getDate(); 
}

function getDate() {
    var d = new Date(); 
    return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear(); 
}