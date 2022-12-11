'use strict';

const mysql = require('mysql');
const express = require('express');
const app = express();
const port = 3000;
const mm = require('musicmetadata');
const fs = require('fs');
const audioFolder = 'public/audio';

app.use(express.json());
app.use(express.static('public'));

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'music_player',
});

conn.connect((err) => {
    if(err) {
		console.log(err, `The database connection couldn't be established`);
		return;
	} else {
		console.log(`Connection established`);
	}
});

// GET renders a static HTML

app.get('/player', (req, res) => {
    res.sendFile(__dirname + '/public/main.html');
});

// PORT LISTEN

app.listen(port, () => {
    console.log(`The server is up and running on ${port}`);
});