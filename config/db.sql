CREATE TABLE users(
	user_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    user_account VARCHAR(15) NOT NULL,
    user_name VARCHAR(16) NOT NULL,
    pwd VARCHAR(100) NOT NULL,
    auth INT NOT NULL DEFAULT 0
);

CREATE TABLE medicine(
	m_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    m_name VARCHAR(10) NOT NULL,
    pinyin VARCHAR(30),
    other_name VARCHAR(30),
    origin VARCHAR(200),
    env VARCHAR(200),
    form VARCHAR(300),
    flavor VARCHAR(100),
    functions VARCHAR(500),
    usages VARCHAR(500)
);

CREATE TABLE record(
	id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    recog_result VARCHAR(10) NOT NULL,
    score INT DEFAULT 2
);

CREATE TABLE collection(
	id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    m_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (m_id) REFERENCES medicine(m_id)
);

CREATE TABLE score(
	id INT PRIMARY KEY,
    score INT DEFAULT 0,
    playtimes INT DEFAULT 0,
    FOREIGN KEY (id) REFERENCES users(user_id)
);

CREATE TRIGGER add_score_item 
AFTER INSERT ON users
FOR EACH ROW
	INSERT INTO score(id) VALUE(new.user_id);