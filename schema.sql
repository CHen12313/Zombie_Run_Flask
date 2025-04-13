DROP TABLE IF EXISTS users;
CREATE TABLE users
(
    userName TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    score TEXT NOT NULL
);


