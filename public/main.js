"use strict";

const notifications = document.querySelector(".notifications");
const logo = document.querySelector(".logo");

const title = document.querySelector(".playing-title");
const artist = document.querySelector(".playing-artist");
const artwork = document.querySelector(".artwork");
const albumCover = document.querySelector(".cover-album");

const tracksTable = document.querySelector(".tracks-table");
const addSongToPlaylist = document.querySelector(".add-to-playlist");
const addSongToFavorites = document.querySelector(".add-to-favorites");

const addPlaylist = document.querySelector(".playlists-heading img");
const playlistsTable = document.querySelector(".playlists-table tbody");
const allTracksPlaylist = document.querySelector("#all-tracks");

const controlPanel = document.querySelector(".control-panel");

const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const progressBar = document.querySelector("#slider-progress");
const volumeBar = document.querySelector("#slider-volume");

const volumeBtn = document.querySelector(".volume-icon");
const shuffleBtn = document.querySelector("#shuffle");

const currentTimePoint = document.querySelector(".current-time");
const endTime = document.querySelector(".end-time");

const audio = document.querySelector("audio");

localStorage.setItem("index", 0);