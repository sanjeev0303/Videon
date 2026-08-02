const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_HYozNJw84htQ@ep-still-haze-attizc30.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require'
});
pool.query('SELECT video_id, "totalViews" FROM video_analytics LIMIT 5;', (err, res) => {
  console.log(err ? err : res.rows);
  pool.end();
});
