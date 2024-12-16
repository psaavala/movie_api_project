import express from 'express';
import { pgPool } from "./pg_connection.js";
import bcrypt from 'bcrypt';
var app = express();


const port = process.env.PORT || 3001;

app.use(express.urlencoded({extended: true}));

app.listen(port, () =>{
    console.log('server is running');
});


/*add genres endpoint*/

app.post('/genre', async (req, res) =>{

    const { genre_id, genre_name} = req.body;

    if (!genre_id || !genre_name) {
        return res.status(400).json({ error: "genre_id and genre_name are required" });
    }

    try { 
        await pgPool.query('INSERT INTO genre VALUES ($1,$2)', [genre_id, genre_name]);
        res.status(201).json({ message: "Genre added succesfully"});     
    } catch (error) {
        res.status(400).json({error: error.message});
    }

});


/*add movies endpoint*/

app.post('/movie/add',  async (req, res) =>{

    const { movie_name, movie_year, genre_id} = req.body;

    /*check for fields are not empty*/

    if (!movie_name || !movie_year || !genre_id) {
        return res.status(400).json({error: "movie_name, movie_year, genre_id are required"});
    }

    /*check for valid year inserted*/
    
    const currentYear = new Date().getFullYear();
    const year = Number(movie_year);
    if (isNaN(year) || year < 1900 || year > currentYear) {
        return res.status(400).json({ error: `movie_year must be a valid year between 1900 and ${currentYear}` });
    }

    try {
        await pgPool.query(
            'INSERT INTO movie (movie_name, movie_year, genre_id) VALUES ($1, $2, $3)',
            [movie_name, movie_year, genre_id]
        );
        res.status(201).json({ message: "Movie added succesfully"});
    } catch (error) {
        res.status(400).json({error: error.message})
    }
});


/*add users endpoint*/

app.post('/uuser', async (req,res) =>{

    const {name, username, password, birthday} = req.body;

    /*check if user already exists*/

    try {
        const userExists = await pgPool.query(
            'SELECT * FROM uuser WHERE username = $1',
            [username]
        );

        if (userExists.rows.length > 0) {
            return res.status(409).json({ error: "Username already exists" });
        }

    /*hash password with bcrypt*/

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await pgPool.query(
            'INSERT INTO uuser (name, username, password, birthday) VALUES ($1, $2, $3, $4)',
            [name, username, hashedPassword, birthday]
        );
        res.status(201).json({ message: "User added succesfully"});
    } catch (error) {
        res.status(400).json({error: error.message})
    }




});

