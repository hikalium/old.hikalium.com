var http = require('http');
var path = require('path');
var UniqnodeServer = (function () {
    function UniqnodeServer(port) {
        var _this = this;
        this.httpServer = http.createServer();
        this.httpServer.on("request", function (req, res) {
            _this.processRequest(req, res);
        });
        this.httpServer.listen(port);
    }
    UniqnodeServer.prototype.processRequest = function (req, res) {
        var reqURL = decodeURI(req.url).split("?")[0].split("/");
        if (reqURL[1] === "id") {
            this.processIDRequest(res, reqURL[2], reqURL[3]);
        }
        else {
            res.write('Not found');
        }
        console.log(reqURL);
        res.end();
    };
    UniqnodeServer.prototype.processIDRequest = function (res, id, action) {
        if (action === void 0) { action = "view"; }
        res.write("id: " + id);
        res.write("action: " + action);
    };
    return UniqnodeServer;
}());
var uniqnode = new UniqnodeServer(8080);
