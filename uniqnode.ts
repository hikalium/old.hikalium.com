const http = require('http');
const path = require('path');

class UniqnodeServer
{
	httpServer;
	constructor(port: number){
		this.httpServer = http.createServer();
		this.httpServer.on("request", (req, res) => {
			this.processRequest(req, res);
		});
		this.httpServer.listen(port);
	}
	processRequest(req, res){
		const reqURL = decodeURI(req.url).split("?")[0].split("/");
		if(reqURL[1] === "id"){
			this.processIDRequest(res, reqURL[2], reqURL[3]);
		} else{
			res.write('Not found');
		}
		console.log(reqURL);
		res.end();
	}
	processIDRequest(res, id, action = "view"){
		res.write("id: " + id);
		res.write("action: " + action)
	}
}

var uniqnode = new UniqnodeServer(8080);
