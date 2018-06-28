const http = require('http');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const fileType = require('file-type');
const marked = require('marked');
const express = require('express');
const CloudStorage = require('@google-cloud/storage');

const pathToViews = "views/";
const pathToStaticFiles = "static/";
const pathToPathTable = "./conf/pathTable.json";
const projectId = 'hikalium-com';

const app = express();
const storage = new CloudStorage({
	projectId: projectId,
});
const bucket = storage.bucket('hikalium-com.appspot.com');

app.set('views', pathToViews);
app.set('view engine', 'ejs');

app.use("/static", express.static(pathToStaticFiles));

function generatePageFromCloudStorage(res, path: string)
{
	console.log("CloudStorage: " + path);
	bucket.getFiles({
		prefix: path.substr(1),
		//delimiter: path.endsWith('/') ? '/' : undefined,
	}).then((results) => {
		const files = results[0];
		if(files.length === 0){
			res.sendStatus(404);
			return;
		} else if(files.length === 1){
			var file = bucket.file(files[0].name);
			file.download({validation: false}).then((data) => {
				var contents = data[0].toString();
				var marked_html = marked(contents).split('src="imgs/').join('src="https://storage.googleapis.com/hikalium-com.appspot.com/imgs/');
				res.render('page.ejs', {contentHtml: marked_html});
			}, (err) => {
				console.log("Error in file.download(): " + err);
				res.sendStatus(500);
			});
		} else{
			var contents = `<h1>Index of ${path}</h1>\n\n`;
			files.forEach(file => {
				contents += `- [/page/${file.name}](/page/${file.name})\n`;
			});
			var marked_html = marked(contents).split('src="imgs/').join('src="https://storage.googleapis.com/hikalium-com.appspot.com/imgs/');
			res.render('page.ejs', {contentHtml: marked_html});
		}
	});
}

// https://cloud.google.com/nodejs/docs/reference/storage/1.7.x/File#get
app.get('/', (req, res) => {
	generatePageFromCloudStorage(res, "/index.md");
});
app.get('/index', (req, res) => {
	generatePageFromCloudStorage(res, "/");
});
app.get('/profile', (req, res) => {
	generatePageFromCloudStorage(res, "/about.md");
});
app.get('/products', (req, res) => {
	generatePageFromCloudStorage(res, "/products.md");
});
app.use('/page/', function(req, res){
	generatePageFromCloudStorage(res, req.path);
});
app.use(function(req, res){
	res.sendStatus(404);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`App listening on port ${PORT}`);
	console.log('Press Ctrl+C to quit.');
});

