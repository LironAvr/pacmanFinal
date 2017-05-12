var users = {};
addUser('a','a');
addUser('test2017', 'test2017');
var currentUser;
var userIn = false;


function addUser(userName, password){
	if(userName in users)
		return false;
	else{
		users[userName] = password;
		return true;
	}
}

function userExists(userName, password){
	if(userName in users)
		return true;
	else
		return false;
}

function rightPassword(userName, password){
	if(users[userName] == password)
		return true;
	else
		return false;
}

function letsPlay(){
    instrucOpen();
}

function playNow(){
    var ins = document.getElementById('instructions');
    ins.style.display = "none";
    $("#setting").hide();
    $("#div_game").show();
    $("#myCanvas").focus();

    startPlaying();
    window.scrollTo(0,document.body.scrollHeight);
}
window.addEventListener("keydown", function(e) {
  // space and arrow keys
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
       e.preventDefault();
   }
}, false);