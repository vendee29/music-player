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

  // PROGRESS BAR

audio.addEventListener("timeupdate", updateProgress);

progressBar.addEventListener("click", setProgress);

// RENDER ALL TRACKS

allTracksPlaylist.addEventListener("click", () => {
    renderPlaylistsTracks("/playlist-tracks");
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
  
  function selectPlaylistRow(className) {
    let rows = document.querySelectorAll(`.${className} tr`);
    for (let j = 0; j < rows.length; j++) {
      rows[j].addEventListener("click", () => {
        setNotSelectedRow(`${className}`);
        rows[j].classList.remove("not-selected");
        rows[j].classList.add("selected");
      });
    }
  }
  
  function renderPlaylistsTracks(api) {
    tracksTable.innerHTML = "";
    localStorage.setItem("index", 0);
  
    fetch(api)
      .then((res) => res.json())
      .then((result) => {
        renderTracksTable(result);
      })
      .catch((err) => console.log(err));
  }
  
  function playNextSong() {
    let trackRows = document.querySelectorAll(".tracks-table tr");
  
    if (shuffleBtn.classList.contains("shuffle-off")) {
      let songIndex = parseInt(localStorage.getItem("index"));
  
      if (songIndex == trackRows.length - 1) {
        songIndex = 0;
      } else {
        songIndex++;
      }
  
      let nextTrackId = trackRows[songIndex].getAttribute("track_id");
      loadTrack(nextTrackId);
      localStorage.setItem("index", songIndex);
  
      if (songIndex == 0) {
        setNotSelectedRow("tracks-table");
        trackRows[songIndex].setAttribute("class", "selected");
      } else {
        trackRows[songIndex - 1].setAttribute("class", "not-selected");
        trackRows[songIndex].setAttribute("class", "selected");
      }
    } else {
    
      let songIndex = Math.round(Math.random() * (trackRows.length - 1));
      let nextTrackId = trackRows[songIndex].getAttribute("track_id");
  
      setNotSelectedRow("tracks-table");
      trackRows[songIndex].setAttribute("class", "selected");
      loadTrack(nextTrackId);
  
      localStorage.setItem("index", songIndex);
    }
  }
  
  function playPreviousSong() {
    let trackRows = document.querySelectorAll(".tracks-table tr");
    let songIndex = parseInt(localStorage.getItem("index"));
  
    if (songIndex == 0) {
      songIndex = trackRows.length - 1;
    } else {
      songIndex--;
    }
  
    let prevTrackId = trackRows[songIndex].getAttribute("track_id");
    loadTrack(prevTrackId);
  
    localStorage.setItem("index", songIndex);
  
    if (songIndex == trackRows.length - 1) {
      setNotSelectedRow("tracks-table");
      trackRows[songIndex].setAttribute("class", "selected");
    } else {
      trackRows[songIndex + 1].setAttribute("class", "not-selected");
      trackRows[songIndex].setAttribute("class", "selected");
    }
  }
  
  function updateProgress(event) {
    let { duration, currentTime } = event.srcElement;
  
    if (isNaN(duration)) {
      duration = 0;
    }
  
    let progressPercent = (currentTime / duration) * 100;
  
    progressBar.value = progressPercent;
    currentTimePoint.textContent = getTime(currentTime);
    endTime.textContent = getTime(duration);
  }
  
  function setProgress(event) {
    let width = 260;
    let click = event.offsetX;
    let duration = audio.duration;
    audio.currentTime = (click / width) * duration;
  }

  function addNewPlaylist() {
    let newPlaylist = prompt("Please name your new playlist:");
  
    if (!newPlaylist) {
      notifications.innerHTML = "No playlist was added.";
      setTimeout(clearNotifications, 5000);
      return;
    } else {
      let playlistTitle = {
        title: newPlaylist,
      };
      fetchContent("/playlists", "POST", playlistTitle)
        .then((res) => res.json())
        .then((result) => {
          notifications.innerHTML = result.message;
          setTimeout(clearNotifications, 5000);
        })
        .catch((err) => console.log(err));
    }
  }
  
  async function fetchContent(api, method, bodyValues) {
    return await fetch(api, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyValues),
    });
  }
