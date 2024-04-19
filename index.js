require('dotenv').config()

const pg = require('pg');
const express = require('express');
const app = express();
app.use(express.json()); //parses req.bodies

const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_notes_categories_db');


const init = async () => {
    await client.connect();
    console.log('db connected');
    // SQL tables step

    let SQL = /*SQL*/ `
        DROP TABLE IF EXISTS notes;
        DROP TABLE IF EXISTS categories;
        
        CREATE TABLE categories(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100)
        );
        CREATE TABLE notes(
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            ranking INTEGER DEFAULT 3 NOT NULL,
            txt VARCHAR(500),
            category_id INTEGER REFERENCES categories(id) NOT NULL
        )
    `
    await client.query(SQL);
    console.log('tables created');
 
    SQL = /*SQL*/`
INSERT INTO categories(name) VALUES('home');
INSERT INTO categories(name) VALUES('work');
INSERT INTO notes(txt, ranking, category_id) VALUES('clean up the kitchen', 1, (SELECT id
from categories WHERE name = 'home'));
INSERT INTO notes(txt, ranking, category_id) VALUES('submit expense reports', 2, (SELECT id
from categories WHERE name = 'home'));
`
await client.query(SQL);
console.log('tables seeded');
const port = process.env.PORT;
app.listen(port, () => console.log(`listening on port ${port}`));

};

app.use((err, req, res, next) => {
    res.status(500).send(err.message);
})

app.get('/api/categories', async (req, res, next) => {
    try {
        let SQL = /*SQL*/ `SELECT * from categories`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
});


app.get('/api/notes', async (req, res, next) => {
    try {
        let SQL = /*SQL*/ `SELECT * from notes`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
});

app.post('/api/notes', async (req, res, next) => {
    try {
        const SQL = /*SQL*/ `INSERT INTO notes(txt, category_id) VALUES($1, $2) RETURNING *`;
        console.log('req.body = ', req.body);
        const response = await client.query(SQL, [req.body.txt, req.body.category_id]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});

app.get('/api/notes/:categoryId', async (req, res, next) => {
    try {
        const { categoryId } = req.params; // Corrected from req.paramsl
        const SQL = /*SQL*/ `SELECT * FROM notes WHERE category_id = ${categoryId}`; // Corrected SQL syntax
        // Now you can execute the SQL query using your database client (e.g., pg.Client)
        // and send the response back to the client
    } catch (error) {
        next(error);
    }
});

init();