import express from 'express';
import { pgPool } from "./pg_connection.js";
var app = express();


const port = process.env.PORT || 3001;

app.use(express.urlencoded({extended: true}));

app.listen(port, () =>{
    console.log('server is running');
});


/*add genres*/

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




app.post('/movie/add',  async (req, res) =>{

    const { movie_name, movie_year, genre_id} = req.body;

    if (!movie_name || !movie_year || !genre_id) {
        return res.status(400).json({error: "movie_name, movie_year, genre_id are required"});
    }

    const currentYear = new Date().getFullYear();
    if (typeof movie_year !== 'number' || movie_year < 1900 || movie_year > currentYear) {
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

