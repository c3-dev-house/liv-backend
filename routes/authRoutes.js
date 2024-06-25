import express from 'express';
import { dummyUsers } from '../dummyData/dummyUsers.js';
import { authenticateSalesforce } from '../services/salesforceService.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
    console.log(username,password);
  const user = dummyUsers.find(u => u.username === username && u.password === password);
  console.log(user);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  try {
    await authenticateSalesforce();
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: 'Salesforce authentication failed', error: error.message });
  }
});

export default router;
