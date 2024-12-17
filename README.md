This is a schoolwork project for a simple movie database API.
Nothing fancy here, scope of work is about learning basic functionalities in making database and programming a simple backend for it.

Idea was to make an API and database with backend. Users can register, add movies to database, write reviews, mark favorite movies and search the database for movies.

What this project contains:

-Simple postgreSQL database with some relations between tables
-ER-diagram for database
-Schema for creating the database
-Backend server (node express) with endpoints for:
  -adding new movie genres
  -adding new movies (name, year, genre)
  -registering users (name, username, password, birthday)
  -get movie by ID
  -remove movie by id
  -getting all movies (with added pagination 10/page)
  -getting movies by keyword
  -adding reviews with (username, stars, reviewtext, movie id)
  -adding favorite movies
  -getting favorite movies by username

  
