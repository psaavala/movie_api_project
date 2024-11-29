import { pgPool } from "./pg_connection.js";

/*try{
  const result = await pgPool.query("");
  console.log(result.rows);
}catch(e){
    console.log(e.message);
}*/

async function insertGenre () {
    try {
        const query = "INSERT INTO genre (genre_id, genre_name) VALUES ($1,$2) RETURNING*";
        const values = [8, 'anime'];

        const result = await pgPool.query(query, values);

        console.log('Inserted Row:', result.rows[0]);
    }catch (e) {
        console.error('Error inserting data:', e.message);
    }
}

insertGenre();





