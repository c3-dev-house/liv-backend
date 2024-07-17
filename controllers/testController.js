import { salesforceRequest } from '../services/salesforceService.js';
import { deleteAll } from '../services/salesforceService.js';


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


export const deleteAllRecords = async (req, res, next) => {
  try {
      const response= await deleteAll('General_Customer__c' ); //ENTER OBJECT TO DELETE
      console.log(response)
      res.status(200).json({ message: 'All records deleted successfully.' });
  } catch (error) {
      console.error('Error deleting all clothing items:', error);
  }
};


