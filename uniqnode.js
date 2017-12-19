const http = require('http');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const fileType = require('file-type');
class UniqnodeServer {
    constructor(port) {
        this.filePathConvertTable = [
            ["", "index.md"],
        ];
        this.httpServer = http.createServer();
        this.httpServer.on("request", (req, res) => {
            this.processRequest(req, res);
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
    processRequest(req, res) {
        const reqURL = decodeURI(req.url).split("?")[0].split("/");
        console.log(reqURL);
        if (reqURL[1] === "id") {
            this.processIDRequest(res, reqURL[2], reqURL[3]);
        }
        else {
            // check local files
            this.processFileRequest(res, reqURL.slice(1).join("/"));
        }
        res.end();
    }
    responseNotFound(res) {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.write('Not found');
    }
    processFileRequest(res, path) {
        // check local files
        var path = "files/" + path;
        console.log(path);
        if (!this.checkPrefix("files", path)) {
            // avoid dir traversal attack
            console.log("prefix check failed.");
            this.responseNotFound(res);
            return;
        }
        try {
            var contents = fs.readFileSync(path);
        }
        catch (e) {
            console.log("file not found");
            this.responseNotFound(res);
            return;
        }
        var ftype = fileType(contents);
        if (!ftype) {
            if (path.endsWith(".css")) {
                ftype = { mime: "text/css" };
            }
            else if (path.endsWith(".js")) {
                ftype = { mime: "text/javascript" };
            }
            else {
                console.log("mime type not found");
                this.responseNotFound(res);
                return;
            }
        }
        console.log(path);
        console.log(ftype);
        res.writeHead(200, { "Content-Type": ftype.mime });
        res.write(contents);
    }
    processIDRequest(res, id, action = "view") {
        var template = fs.readFileSync("templates/view.ejs", "utf8");
        var contents = "failed";
        if (template) {
            contents = ejs.render(template, { contents: `
			<ul>
				<li>${action}</li>
				<li>${id}</li>
			</ul>
		` });
        }
        res.writeHead(201, { "Content-Type": "text/html; charset=utf-8" });
        res.write(contents);
    }
}
var uniqnode = new UniqnodeServer(8080);
