import { salesforceRequest } from '../services/salesforceService.js';

export const test = async (req, res, next) => {
  try {
    console.log('Sending request to Salesforce...');
    const data = await salesforceRequest('GET', '/services/data/v52.0/sobjects/Account');
    console.log('Received data from Salesforce:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching data from Salesforce:', error.message);
    next(error);
  }
};
