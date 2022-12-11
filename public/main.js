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

// PLAY BUTTON

playBtn.addEventListener("click", () => {
    let isPlaying = controlPanel.classList.contains("is-playing");
  
    if (!isPlaying) {
      playTrack();
    } else {
      pauseTrack();
    }
  });

// HELPER FUNCTIONS

function loadTrack(track_id) {
    localStorage.setItem("track_id", track_id);
    const tracksTableRows = document.querySelectorAll(".tracks-table tr");
    for (let i = 0; i < tracksTableRows.length; i++) {
      if (tracksTableRows[i].getAttribute("track_id") == track_id) {
        title.textContent = tracksTableRows[i].getAttribute("track_title");
        artist.textContent = tracksTableRows[i].getAttribute("track_artist");
        endTime.innerHTML = tracksTableRows[i].getAttribute("track_duration");
        audio.src = tracksTableRows[i].getAttribute("track_path");
      }
    }
    progressBar.value = 0;
    albumCover.setAttribute(
      "style",
      `background: url('img/${track_id}.jpg'); background-size: contain; background-repeat: no-repeat; background-position: center;`
    );
  
    setAsFavorite(track_id)
      .then((result) => {
        playTrack();
      })
      .catch((err) => console.log(err));
  }
  
  async function setAsFavorite(track_id) {
    let response = await fetch(`/playlist-tracks/1/${track_id}`);
    let isFavorite = await response.json();
    if (isFavorite) {
      addSongToFavorites.style.filter = "brightness(0)";
    } else {
      addSongToFavorites.style.filter = "brightness(1)";
    }
    return isFavorite;
  }
  
  function playTrack() {
    playBtn.classList.add("pause");
    playBtn.classList.remove("play");
    controlPanel.classList.add("is-playing");
    audio.play();
  }
  
  function pauseTrack() {
    playBtn.classList.add("play");
    playBtn.classList.remove("pause");
    controlPanel.classList.remove("is-playing");
    audio.pause();
  }
  
  function clearNotifications() {
    notifications.innerHTML = "";
  }
  
  function getTime(seconds) {
    let s = parseInt(seconds % 60);
    let m = parseInt((seconds / 60) % 60);
    let mm = m < 10 ? "0" + m : m;
    let ss = s < 10 ? "0" + s : s;
    return mm + ":" + ss;
  }
  
  function setSelectedRow(row) {
    if (row.classList.contains("not-selected")) {
      row.classList.remove("not-selected");
      row.classList.add("selected");
    }
  }
  
  function setNotSelectedRow(tableClass) {
    let rows = document.querySelectorAll(`.${tableClass} tr`);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].classList.contains("selected")) {
        rows[i].classList.remove("selected");
        rows[i].classList.add("not-selected");
      }
    }
  }
  