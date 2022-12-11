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

// GET /import-tracks // imports all tracks from the audio folder

app.get("/import-tracks", (req, res) => {
  importSongsToDb()
    .then((result) => res.status(200).json(result))
    .catch((err) => console.log(err));
});

// GET /playlists

app.get("/playlists", (req, res) => {
  queryDb("SELECT * FROM playlists")
    .then((data) => res.status(200).json(data))
    .catch((err) => console.log(err));
});

// POST /playlists // title is required

app.post("/playlists", (req, res) => {
  let title = req.body.title;

  if (title == "null" || title == null || title == undefined) {
    res.status(400).json({
      message: "No playlist was added.",
    });
  }

  createPlaylist(title)
    .then((result) => {
      if (result.message == "This title is already in use.") {
        res.status(400).json(result);
      } else {
        res.status(200).json(result);
      }
    })
    .catch((err) => console.log(err));
});

// DELETE /playlists/:id

app.delete("/playlists/:id", (req, res) => {
  if (!req.params.id || isNaN(req.params.id)) {
    res.status(400).json({
      error: "Please provide a valid playlist id.",
    });
  } else {
    let id = req.params.id;
    deletePlaylist(id)
      .then((result) => {
        if (result.message) {
          res.status(400).json(result);
        } else {
          res.status(204).json(result);
        }
      })
      .catch((err) => console.log(err));
  }
});

// PORT LISTEN

app.listen(port, () => {
  console.log(`The server is up and running on ${port}`);
});

// HELPER FUNCTIONS

function queryDb(sqlQuery, valuesArr) {
  return new Promise((resolve, reject) => {
    conn.query(sqlQuery, valuesArr, (err, result) => {
      if (err) {
        return reject("DATABASE ERROR");
      } else {
        return resolve(result);
      }
    });
  });
}

// importing data to database
function readFileNames() {
  let songsInDir = [];
  fs.readdirSync(audioFolder).forEach((file) => {
    songsInDir.push(file);
  });
  return songsInDir;
}

async function importSongsToDb() {
  let folderSongs = readFileNames();
  let folderSongsPaths = [];
  for (let i = 0; i < folderSongs.length; i++) {
    let song = await getMeta(folderSongs[i]);
    folderSongsPaths.push(song.path);
  }

  for (let i = 0; i < folderSongsPaths.length; i++) {
    let duplicateSong = await queryDb("SELECT * FROM tracks WHERE path = ?", [
      folderSongsPaths[i],
    ]);
    if (duplicateSong.length == 0) {
      await queryDb("INSERT INTO tracks (path) VALUES (?)", [
        folderSongsPaths[i],
      ]);
    }
  }
  return await queryDb("SELECT * FROM tracks");
}

function promisifyMeta(fileName) {
  return new Promise((resolve, reject) => {
    const readableStream = fs.createReadStream(
      __dirname + `/public/audio/${fileName}`
    );
    mm(readableStream, { duration: true }, (err, metadata) => {
      if (err) {
        return reject(err);
      } else {
        readableStream.close();
        return resolve(metadata);
      }
    });
  });
}

async function getMeta(fileName) {
  let metadata = await promisifyMeta(fileName);
  return {
    title: metadata.title,
    artist: metadata.artist[0],
    duration: metadata.duration,
    path: `/audio/${fileName}`,
  };
}

// create playlist

async function createPlaylist(title) {
  let select = await queryDb("SELECT * FROM playlists WHERE title = ?", [
    title,
  ]);
  if (select.length > 0) {
    return {
      message: "This title is already in use.",
    };
  } else {
    let insert = await queryDb("INSERT INTO playlists (title) VALUES (?)", [
      title,
    ]);
    return {
      message: `The playlist ${title} was added.`,
    };
  }
}

// delete playlist

async function deletePlaylist(id) {
  let select = await queryDb(
    "SELECT * FROM playlists WHERE system_rank = ? AND id = ?",
    [1, id]
  );
  if (select.length > 0) {
    return {
      message: "This playlist cannot be deleted.",
    };
  }
  let response = await queryDb("DELETE FROM playlists WHERE id = ?", [id]);
  if (response.affectedRows == 0) {
    return {
      message: "Something went wrong. No playlist was deleted.",
    };
  } else {
    return response;
  }
}
