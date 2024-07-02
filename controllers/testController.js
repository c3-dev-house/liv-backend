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

export const deleteAllClothingItems = async (req, res, next) => {
    try {
        await deleteAllClothingItems();
        res.status(200).json({ message: 'All clothing items deleted successfully.' });
    } catch (error) {
        console.error('Error deleting all clothing items:', error);
        next(error);
    }
};

export const deleteAllClothingBundles = async (req, res, next) => {
  try {
      await deleteAllClothingBundles();
      res.status(200).json({ message: 'All clothing bundles deleted successfully.' });
  } catch (error) {
      console.error('Error deleting all clothing items:', error);
      next(error);
  }
};


