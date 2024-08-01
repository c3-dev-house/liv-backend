import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
//const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();
const corsOptions = {
  origin: ['http://127.0.0.1:5173', 'https://uat.d3jhtng4dfyk5v.amplifyapp.com'],
  credentials: true, // for allowing credentials (cookies, authorization headers)
};
app.use(cors(corsOptions));
//app.use(cors());
app.options('*', cors(corsOptions));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://uat.d3jhtng4dfyk5v.amplifyapp.com");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Something is working');
});

app.use('/api', routes);

//app.use(errorMiddleware); 

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
