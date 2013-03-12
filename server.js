/*
Author: Sachin Mohite
Description: This the Server for the Demonstration of Robot control exercise

*/

var http = require('http')
	, path = require('path')
	, connect = require('connect')
	, express = require('express')
	, url = require('url')
	, app = express();

var cookieParser = express.cookieParser('your secret sauce')
	, sessionStore = new connect.middleware.session.MemoryStore();

//Directions array used as a Enum	
var directions = {"N" : 1, "E" : 2, "S" : 3, "W" : 4};

app.configure(function () {
	app.set('views', path.resolve('views'));
	app.set('view engine', 'jade');

	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(cookieParser);
	app.use(express.session({ store: sessionStore }));
	app.use(app.router);
});

//Creat Server call with Expresss
var server = http.createServer(app)
	, io = require('socket.io').listen(server);

var SessionSockets = require('session.socket.io')
	, sessionSockets = new SessionSockets(io, sessionStore, cookieParser);

//Starting the HTTP Server on Given port 3000
server.listen(3000);

//Object of the robot defined
var objRobot;

app.get('/', function(req, res) {
	req.session.robot = req.session.robot || undefined;
	//res.render('(id: ' + req.query["id"] + ')');
	var queryString=url.parse(req.url, true).query;

	//Sending Rendering response to the connection
	if(queryString.controller=='true')
	{
		res.render('controller');
	}//if(queryString.controller=='true')
	else if(queryString.controller=='false')
	{
		res.render('robot');
	}//else
	else
	{
		res.write("Wrong query string passed.. Controller Veiw: Mention controller=true in the URL.. Robot View: Mention controller=false in the URL..");
		res.end();
	}
});

//On sessionSockets Message : connection
sessionSockets.on('connection', function (err, socket, session) {
	
	//Emit Socket Message : session
	socket.emit('session', session);

	//On Socket Message : creatRobot
	socket.on('creatRobot',function(type){
		if(typeof objRobot==="undefined" || objRobot==null){
			objRobot = new robot(type);
			session.robot = objRobot;
			session.save();
			
			socket.emit('creatRobot', objRobot);
			socket.broadcast.emit('creatRobot', objRobot);
		}//if(typeof objRobot==="undefined" || objRobot==null){
		else
		{
			objRobot = null;
			session.robot = objRobot;
			session.save();

			socket.emit('deleteRobot', objRobot);
			socket.broadcast.emit('deleteRobot', objRobot);
		}//ELSE

		//Emiting the messages
		//socket.emit('session', session);
		//socket.broadcast.emit('session', session);

	});//socket.on('creatRobot',function(type){

	//On Socket Message : creatRobot
	socket.on('deleteRobot',function(objRobot){
		if(typeof objRobot!=="undefined" || objRobot!=null){
			objRobot = null;
			session.robot = objRobot;
			session.save();
		}//if(typeof objRobot==="undefined" || objRobot==null){

		//Emiting the messages
		socket.emit('session', session);
		socket.broadcast.emit('session', session);
		socket.emit('creatRobot', objRobot);
		socket.broadcast.emit('creatRobot', objRobot);
	});//socket.on('creatRobot',function(type){	
	
	//On Socket Message : updateRobot
	socket.on('updateRobot', function(keyUnicode) {
		if(typeof objRobot==="undefined" || objRobot==null)
		{
			return false;
		}//if(typeof objRobot==="undefined" || objRobot==null)

		for (var index=0; index < keyUnicode.length; index++)
		{
			switch(keyUnicode.charAt(index))
			  {

				//Forward:
				case 'f':
				case 'F':
				{
						if(objRobot.dir==directions["N"] && objRobot.y<9)
						{							
							objRobot.y++;
						}//if(objRobot.dir==directions["N"])
						else if(objRobot.dir==directions["E"] && objRobot.x<34)
						{
							objRobot.x +=1;
						}//else if(objRobot.dir==directions["E"])
						else if(objRobot.dir==directions["W"] && objRobot.x>0)
						{
							objRobot.x--;
						}//else if(objRobot.dir==directions["W"])
						else if(objRobot.dir==directions["S"] && objRobot.y>0)
						{
							objRobot.y--;
						}//else if(objRobot.dir==directions["S"])
				
				}
				break;

				//Right: 
				case 'r':
				case 'R':
				  {
						if(++objRobot.dir>directions["W"])
						{
							objRobot.dir=directions["N"];
						}//if(++objRobot.dir>directions["W"])
				}
				break;

				//Left: 
				case 'l':
				case 'L':
				  {

						if(--objRobot.dir<directions["N"])
						{
							objRobot.dir=directions["W"];
						}//if(--objRobot.dir<directions["N"])
				}
				break;

				//Down: Works only for AirBorne Vehichles
				case 'd':
				case 'D':
				  {
						if(objRobot.type === "AirBorneVehicle")
						{
							objRobot.z -=10;
						}//if(objRobot.type === "AirBorneVehicle")
					
				}
				break;

				//Up: Works only for AirBorne Vehichles
				case 'u':
				case 'U':
				  {
						if(objRobot.type === "AirBorneVehicle")
						{
							objRobot.z +=10;
						}//if(objRobot.type === "AirBorneVehicle")
					
				}
				break;

			}//Switch

		}//for (var index=0; index < keyUnicode.length; index++)

		//Saving updated Robot positions in Sessions.
		session.robot = objRobot;
		session.save();

		//Emitting Messages
		//socket.emit('session', session);
		//socket.broadcast.emit('session', session);
		socket.emit('updateRobot', objRobot);
		socket.broadcast.emit('updateRobot', objRobot);
	
  });//	function(keyUnicode) {

});//sessionSockets.on(


//Function used as the Classe for storing the details of the Instance
/*Function: robot(){
Parameter: type
Return: None*/
function robot(type){
	this.type = type;
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.dir = directions["N"];
}//function robot(type){


/*Function: getPosition(){
Parameter: None
Return: Position of the Robot*/
robot.prototype.getPosition = function(){
	return robot.prototype.x+','+robot.prototype.y+','+robot.prototype.z;
}//function getPosition(){


/*Function: getDirection(){
Parameter: None
Return: Direction of the Robot*/
robot.prototype.getDirection = function(){
	return this.dir;
}//function getDirection(){