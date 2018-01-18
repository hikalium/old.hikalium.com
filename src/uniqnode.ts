const http = require('http');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const fileType = require('file-type');
const marked = require('marked');

const pathToPathTable = "./conf/pathTable.json";

class UniqnodeServer
{
	httpServer;
	filePathConvertTable = {};
	constructor(port: number){
		this.httpServer = http.createServer();
		this.httpServer.on("request", (req, res) => {
			var reqPath = decodeURI(req.url).split("?")[0];
			this.processRequest(reqPath, res);
		});
		this.httpServer.listen(port);
		console.log("listening on port:" + port);
	}
	checkPrefix(prefix, candidate) {
		// .resolve() removes trailing slashes
		var absPrefix = path.resolve(prefix) + path.sep;
		var absCandidate = path.resolve(candidate) + path.sep;
		return absCandidate.substring(0, absPrefix.length) === absPrefix;
	}
	processRequest(reqPath, res){
		var splitted = reqPath.split("/");
		if(splitted[1] === "id"){
			this.processIDRequest(res, splitted[2], splitted[3]);
		} else{
			// check local files
			this.processFileRequest(res, splitted.slice(1).join("/"));
		}
		res.end();
	}
	responseNotFound(res){
		res.writeHead(404, {"Content-Type": "text/html; charset=utf-8"});
		res.write(this.getHTMLWithContentHTML("<h2>Not found...</h2>"));
	}
	updateFilePathConvertTable(){
		try{
			this.filePathConvertTable = JSON.parse(fs.readFileSync(pathToPathTable, "utf-8"));
		} catch(e){
			console.log("failed to load pathTable");
			return;
		}
	}
	processFileRequest(res, path: string){
		// check local files
		this.updateFilePathConvertTable();
		if(this.filePathConvertTable[path]){
			this.processFileRequest(res, this.filePathConvertTable[path]);
			return;
		}
		//
		var path = "files/" + path;
		console.log("[file] " + path);
		//
		if(!this.checkPrefix("files", path)){
			// avoid dir traversal attack
			console.log("prefix check failed.");
			this.responseNotFound(res);
			return;
		}
		try{
			var contents = fs.readFileSync(path);
		} catch(e){
			try{
				path += ".md";
				var contents = fs.readFileSync(path);
			} catch(e){
				console.log("file not found");
				this.responseNotFound(res);
				return;
			}
		}
		var ftype = fileType(contents);
		if(!ftype){
			if(path.endsWith(".css")){
				ftype = {mime: "text/css"};
			} else if(path.endsWith(".js")){
				ftype = {mime: "text/javascript"};
			} else if(path.endsWith(".md")){
				ftype = {mime: "text/html"};
				contents = this.getHTMLWithContentHTML(marked(contents + "</pre>"));
			} else{
				console.log("mime type not found");
				this.responseNotFound(res);
				return;
			}
		}
		res.writeHead(200, {"Content-Type": ftype.mime});
		res.write(contents);
	}
	getHTMLWithContentHTML(contentHTML)
	{
		var template = fs.readFileSync("templates/view.ejs", "utf8");
		var contents = "failed";
		if(template){
			contents = ejs.render(template, {contents: contentHTML});
		}
		return contents;
	}
	processIDRequest(res, id, action = "view"){
		var contents = this.getHTMLWithContentHTML(`
			<ul>
				<li>${action}</li>
				<li>${id}</li>
			</ul>
		`);
		res.writeHead(201, {"Content-Type": "text/html; charset=utf-8"});
		res.write(contents);
	}
}

var uniqnode = new UniqnodeServer(8080);
