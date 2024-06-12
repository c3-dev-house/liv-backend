import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
//const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', routes);

//app.use(errorMiddleware); 

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
