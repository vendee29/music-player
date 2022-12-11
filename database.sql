CREATE DATABASE music_player;
USE music_player;

CREATE TABLE playlists (
	id INT AUTO_INCREMENT PRIMARY KEY,
    title TINYTEXT,
    system_rank TINYINT DEFAULT 0
);

CREATE TABLE tracks (
	id INT AUTO_INCREMENT PRIMARY KEY,
    path TINYTEXT
);

CREATE TABLE playlist_content (
	id INT AUTO_INCREMENT PRIMARY KEY,
    playlist_id INT,
    track_id INT
);

INSERT INTO playlists (playlist, system_rank) VALUES ('Favorites', 1);
INSERT INTO playlists (playlist) VALUES ('Relaxing music for programming');

ALTER TABLE playlist_content ADD FOREIGN KEY (playlist_id) REFERENCES playlists(id);
ALTER TABLE playlist_content ADD FOREIGN KEY (track_id) REFERENCES tracks(id);