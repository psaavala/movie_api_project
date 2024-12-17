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

/* get movie by id endpoint*/

app.get('/movie/:id', async (req, res) =>{

    const movieId = req.params.id;

     /*Check if movieId is valid*/

    if (isNaN(movieId)) {
        return res.status(400).json({ error: "Invalid movie ID" });
    }

    try {
        const result = await pgPool.query('SELECT * FROM movie WHERE movie_id = $1', [movieId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Movie not found" });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


/* delete movie by id endpoint*/

app.delete('/movie/:id', async (req, res) => {
    const movieDelId = req.params.id;

    /*Check id movieID is valid*/

    if (isNaN(movieDelId)) {
        return res.status(400).json({ error: "Invalid movie ID" });
    }

    try {
        
        const result = await pgPool.query('DELETE FROM movie WHERE movie_id = $1 RETURNING *', [movieDelId]);

        if (result.rowCount === 0) {
            
            return res.status(404).json({ error: "Movie not found" });
        }

        
        res.status(200).json({ message: "Movie deleted successfully", movie: result.rows[0] });
    } catch (error) {
       
        res.status(500).json({ error: error.message });
    }
});


/* get all movies endpoint*/

app.get('/movies', async (req,res) =>{
    
    const page = parseInt(req.query.page) || 1;
    const moviesPerPage = 10;

    const offset = (page - 1) * moviesPerPage;

    try {
        const query ='SELECT movie.movie_id, movie.movie_name, movie.movie_year, genre.genre_name FROM movie JOIN genre ON movie.genre_id = genre.genre_id ORDER BY movie.movie_id LIMIT $1 OFFSET $2';
        const result = await pgPool.query(query, [moviesPerPage, offset]);
        res.status(200).json({ message: "Received movies succesfully", currentpage: page, moviesPerPage: moviesPerPage, movies: result.rows });
    } catch (error) {
        res.status(500).json({error: error.message})
    }
});



/* get all movies by keyword*/

app.get('/movies/search', async (req,res) =>{

    const { keyword } = req.query;

    /*Check for empty search(valid keyword) */

    if (!keyword) {
        return res.status(400).json({ error: "Keyword is required" });
    }

    try {
        const query = `
            SELECT 
                movie.movie_id, 
                movie.movie_name, 
                movie.movie_year, 
                genre.genre_name 
            FROM 
                movie 
            JOIN 
                genre 
            ON 
                movie.genre_id = genre.genre_id 
            WHERE 
                movie.movie_name ILIKE $1
            ORDER BY 
                movie.movie_id;
        `;
        
        /* Allow search results by partial matching with '%' */

        const result = await pgPool.query(query, [`%${keyword}%`]);

        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No movies found for the given keyword" });
        }

        
        res.status(200).json({ 
            message: "Movies retrieved successfully", 
            movies: result.rows 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/*Endpoint for reviewing movies*/

app.post('/movie/review', async (req, res) => {
    const { id, movie_id, review_stars, review_text } = req.body;

    /* Check for valid input */
    if (!id || !movie_id || !review_stars || !review_text) {
        return res.status(400).json({
            error: "All fields (id, movie_id, review_stars, review_text) are required"
        });
    }

    /* Check for right amount of stars */
    if (review_stars < 1 || review_stars > 5) {
        return res.status(400).json({
            error: "review_stars must be between 1 and 5"
        });
    }

    try {
        /* Check if a review already exists for the user and movie */
        const checkQuery = `
            SELECT * FROM review 
            WHERE id = $1 AND movie_id = $2;
        `;

        const checkResult = await pgPool.query(checkQuery, [id, movie_id]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({
                error: "User has already reviewed this movie"
            });
        }

        const insertQuery = `
            INSERT INTO review (id, movie_id, review_stars, review_text)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;

        const result = await pgPool.query(insertQuery, [id, movie_id, review_stars, review_text]);

        res.status(201).json({
            message: "Review posted successfully",
            review: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


/*Endpoint for make user favourite movies*/


app.post('/movie/favorite', async (req, res) => {
    const { id, movie_id } = req.body;

    /* Check for valid input */
    if (!id || !movie_id) {
        return res.status(400).json({
            error: "Both user ID (id) and movie ID (movie_id) are required"
        });
    }

    try {
      
        const query = `
            INSERT INTO fav_movie (id, movie_id)
            VALUES ($1, $2)
            ON CONFLICT (id, movie_id) DO NOTHING
            RETURNING *;
        `;

        const result = await pgPool.query(query, [id, movie_id]);

      
        if (result.rowCount === 0) {
            return res.status(409).json({
                message: "This movie is already in the user's favorites"
            });
        }

        res.status(201).json({
            message: "Movie added to favorites successfully",
            favorite: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



/*Endpoint for fetching users favourite movies by username*/

app.get('/movies/favorites', async (req, res) => {
    const { username } = req.query;

    /* Check for valid input*/
    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    try {
        /* SQL query to get favorite movies by username */
        const query = `
            SELECT movie.movie_id, movie.movie_name, movie.movie_year, genre.genre_name
            FROM fav_movie
            JOIN uuser ON fav_movie.id = uuser.id
            JOIN movie ON fav_movie.movie_id = movie.movie_id
            JOIN genre ON movie.genre_id = genre.genre_id
            WHERE uuser.username = $1;
        `;

       
        const result = await pgPool.query(query, [username]);

        /* Check if user has no favorite movies */
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "No favorite movies found for the given username"
            });
        }


        res.status(200).json({
            message: "Favorite movies retrieved successfully",
            favorites: result.rows
        });
    } catch (error) {

        res.status(500).json({ error: error.message });
    }
});