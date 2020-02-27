
function isAndroidBrowser() {
    return /Android/i.test(navigator.userAgent);
}

function postLoginButtonHandler(loginType, respHandler) {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let companyname = document.getElementById("companyname").value;

    console.log(loginType, username, password, companyname);

    var data = { userName: username, password: password };
    if(loginType === "login")
        data.companyName = companyname;
    else if(loginType === "enterpriseAdminLogin") {
        data.companyName = companyname;
        data.admin = true;
    }
    else if(loginType === "globalAdminLogin") 
        data.admin = true;

    var dataStr = JSON.stringify(data);
    invokePostAPI("/api/v1/login/", dataStr, true, function() {
        if(this.readyState == 4 && this.status == 200) {
            if(respHandler)
                respHandler(this);
            else
                document.getElementById("updateStatus").innerHTML = this.responseText;
        }
        else if(this.readyState == 4){
            if(respHandler)
                respHandler(this);
            else
                document.getElementById("updateStatus").innerHTML = this.responseText;
            //alert("Error in invoking API. please retry.");
        }
    });
    return false;
}

function login(respHandler) {
    return postLoginButtonHandler("login", respHandler);
}

function enterpriseAdminLogin(respHandler) {
    return postLoginButtonHandler("enterpriseAdminLogin", respHandler);
}

function globalAdminLogin(respHandler) {
    return postLoginButtonHandler("globalAdminLogin", respHandler);
}

function logout(respHandler) {
    invokeGetAPI("/api/v1/logout/", true, function() {
        if(this.readyState == 4 && this.status == 200) {
            if(respHandler)
                respHandler(this);
            else
                document.getElementById("updateStatus").innerHTML = this.responseText;
        }
        else if(this.readyState == 4){
            if(respHandler)
                respHandler(this);
            else
                document.getElementById("updateStatus").innerHTML = this.responseText;
            //alert("Error in invoking API. please retry.");
        }
    });
    return false;
}

function createEnterprise() { 
    var dataStr = document.getElementById("enterpriseSpec").value;
    invokePostAPI("/api/v1/enterprise/", dataStr, true, function() {
        if(this.readyState == 4 && this.status == 200) {
            document.getElementById("updateStatus").innerHTML = this.responseText;
        }
        else if(this.readyState == 4){
            document.getElementById("updateStatus").innerHTML = this.responseText;
            //alert("Error in invoking API. please retry.");
        }
    });
    return false;

}

function getEnterprise() {
    invokeGetAPI("/api/v1/enterprise/" + document.getElementById("enterpriseId").value, true, function() {
        if(this.readyState == 4 && this.status == 200) {
            document.getElementById("updateStatus").innerHTML = this.responseText;
        }
        else if(this.readyState == 4){
            document.getElementById("updateStatus").innerHTML = this.responseText;
            //alert("Error in invoking API. please retry.");
        }
    });
    return false;    
}

function createEmployee() { 
    var dataStr = document.getElementById("employeeSpec").value;
    invokePostAPI("/api/v1/employee/", dataStr, true, function() {
        if(this.readyState == 4 && this.status == 200) {
            document.getElementById("updateStatus").innerHTML = this.responseText;
        }
        else if(this.readyState == 4){
            document.getElementById("updateStatus").innerHTML = this.responseText;
            //alert("Error in invoking API. please retry.");
        }
    });
    return false;

}

function getEmployee() {
    invokeGetAPI("/api/v1/employee/" + document.getElementById("employeeId").value, true, function() {
        if(this.readyState == 4 && this.status == 200) {
            document.getElementById("updateStatus").innerHTML = this.responseText;
        }
        else if(this.readyState == 4){
            document.getElementById("updateStatus").innerHTML = this.responseText;
            //alert("Error in invoking API. please retry.");
        }
    });
    return false;    
}

function createFaceFeatures() { 
    var dataStr = document.getElementById("faceFeaturesSpec").value;
    invokePostAPI("/api/v1/faceFeatures/", dataStr, true, function() {
        if(this.readyState == 4 && this.status == 200) {
            document.getElementById("updateStatus").innerHTML = this.responseText;
        }
        else if(this.readyState == 4){
            document.getElementById("updateStatus").innerHTML = this.responseText;
            //alert("Error in invoking API. please retry.");
        }
    });
    return false;

}

function getFaceFeatures() {
    invokeGetAPI("/api/v1/faceFeatures/", true, function() {
        if(this.readyState == 4 && this.status == 200) {
            document.getElementById("updateStatus").innerHTML = this.responseText;
        }
        else if(this.readyState == 4){
            document.getElementById("updateStatus").innerHTML = this.responseText;
            //alert("Error in invoking API. please retry.");
        }
    });
    return false;    
}
