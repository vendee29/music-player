"use strict";

const utils = require("./utils");
const mysql = require("mysql");
const express = require("express");
const app = express();
const port = 3000;

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

// POST /playlists // adds new playlist / title is required

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

// GET /import-tracks // imports all tracks from the audio folder

app.get("/import-tracks", (req, res) => {
  importSongsToDb()
    .then((result) => res.status(200).json(result))
    .catch((err) => console.log(err));
});

// GET /playlist-tracks/
// return all tracks

app.get("/playlist-tracks", (req, res) => {
  getAllTracks(undefined)
    .then((result) => res.status(200).json(result))
    .catch((err) => console.log(err));
});

// GET /playlist-tracks/:playlist_id

app.get("/playlist-tracks/:playlist_id", (req, res) => {
  let playlist_id = req.params.playlist_id;

  getAllTracks(playlist_id)
    .then((result) => res.status(200).json(result))
    .catch((err) => console.log(err));
});

// POST /playlist-tracks/:playlist_id // Adds the track to the playlist identified by playlist_id

app.post("/playlist-tracks/:playlist_id/:track_id", (req, res) => {
  let { playlist_id, track_id } = req.params;

  addToPlaylist(track_id, playlist_id)
    .then((result) => res.status(200).json(result))
    .catch((err) => console.log(err));
});

// GET /playlist-tracks/:playlist_id/:track_id

app.get("/playlist-tracks/:playlist_id/:track_id", (req, res) => {
  let { playlist_id, track_id } = req.params;

  isTrackOnPlaylist(playlist_id, track_id)
    .then((result) => res.status(200).json(result))
    .catch((err) => console.log(err));
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

async function getAllTracks(playlist_id) {
  let queryIfPlaylistId =
    "SELECT tracks.id, path, playlist_id FROM tracks LEFT JOIN playlist_content ON tracks.id = track_id WHERE playlist_id = ?";
  let queryIfNoPlaylistId =
    "SELECT tracks.id, path, playlist_id FROM tracks LEFT JOIN playlist_content ON tracks.id = track_id GROUP BY tracks.id;";
  let query = playlist_id ? queryIfPlaylistId : queryIfNoPlaylistId;

  let allTracks = await queryDb(query, [playlist_id]);
  let allTracksInfo = [];

  for (let i = 0; i < allTracks.length; i++) {
    let fileName = allTracks[i].path.split("/")[2];
    let meta = await utils.getMeta(fileName);
    let track = {};
    track.id = allTracks[i].id;
    track.title = meta.title;
    track.artist = meta.artist;
    track.duration = meta.duration;
    track.path = allTracks[i].path;
    allTracksInfo.push(track);
  }

  return allTracksInfo;
}

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

async function addToPlaylist(track_id, playlist_id) {
  let select = await queryDb(
    "SELECT * FROM playlist_content WHERE track_id = ? AND playlist_id = ?",
    [track_id, playlist_id]
  );
  if (select.length > 0) {
    await queryDb(
      "DELETE FROM playlist_content WHERE track_id = ? AND playlist_id = ?",
      [track_id, playlist_id]
    );
    return {
      message: "The song was removed from the playlist ",
    };
  } else {
    await queryDb(
      "INSERT INTO playlist_content (track_id, playlist_id) VALUES (?, ?)",
      [track_id, playlist_id]
    );
    return {
      message: "The song was added to the playlist ",
    };
  }
}

async function isTrackOnPlaylist(playlist_id, track_id) {
  let select = await queryDb(
    "SELECT * FROM playlist_content WHERE playlist_id = ? AND track_id = ?;",
    [playlist_id, track_id]
  );
  if (select.length > 0) {
    return true;
  }
  return false;
}
