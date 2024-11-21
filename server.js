import express from 'express';
var app = express();

const port = process.env.PORT || 3001;

app.listen(port, () =>{
    console.log('server is running');
});

app.get('/', (req, res)=> res.send('hello world'));

app.get('/movie', (req, res) => res.send('Movies endpoint'));
app.get('/uuser', (req, res) => res.send('Users endpoint'));
app.get('/review', (req, res) => res.send('Reviews endpoint'));
app.get('/genre', (req, res) => res.send('genre endpoint'));
app.get('/fav_movie', (req, res) => res.send('fav_movie endpoint'));

