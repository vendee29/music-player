"use strict";

const mysql = require("mysql");
const express = require("express");
const app = express();
const port = 3000;
const mm = require("musicmetadata");
const fs = require("fs");
const audioFolder = "public/audio";

app.use(express.json());
app.use(express.static("public"));

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "music_player",
});

conn.connect((err) => {
  if (err) {
    console.log(err, `The database connection couldn't be established`);
    return;
  } else {
    console.log(`Connection established`);
  }
});

// GET renders a static HTML

app.get("/player", (req, res) => {
  res.sendFile(__dirname + "/public/main.html");
});

// GET /playlists

app.get("/playlists", (req, res) => {
  queryDb("SELECT * FROM playlists")
    .then((data) => res.status(200).json(data))
    .catch((err) => console.log(err));
});

// POST /playlists // title is required

app.post('/playlists', (req, res) => {
    let title = req.body.title;

    if(title == 'null' || title == null || title == undefined) {
        res.status(400).json({
            message: 'No playlist was added.'
        });
    }

    createPlaylist(title)
    .then(result => {
        if(result.message == 'This title is already in use.') {
            res.status(400).json(result);
        } else {
            res.status(200).json(result);
        }
    })
    .catch(err => console.log(err))
})

// PORT LISTEN

app.listen(port, () => {
  console.log(`The server is up and running on ${port}`);
});

// HELPER FUNCTIONS

function queryDb(sqlQuery, valuesArr) {
    return new Promise((resolve, reject) => {
        conn.query(sqlQuery, valuesArr, (err, result) => {
            if(err) {
                return reject('DATABASE ERROR');
            } else {
                return resolve(result);
            }
        })
    }) 
}

// create playlist

async function createPlaylist(title) {
    let select = await queryDb('SELECT * FROM playlists WHERE title = ?', [title]);
    if(select.length > 0) {
        return {
            'message': 'This title is already in use.'
        }
    } else {
        let insert = await queryDb('INSERT INTO playlists (title) VALUES (?)', [title]);
        return {
            'message': `The playlist ${title} was added.`
        }
    }
}