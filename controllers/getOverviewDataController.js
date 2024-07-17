import { salesforceRequest } from '../services/salesforceService.js';

export const getBeneficiarySales = async (req, res, next) => {
  const userId = req.params.userId; // Assuming the user ID is passed as a URL parameter

  try {
    // console.log('Sending request to Salesforce for total profit...');
    const totalProfitQuery = `SELECT SUM(Total_Profit__c) totalProfit FROM Beneficiary_Sales__c WHERE Beneficiary__c='${userId}'`;
    const totalProfitEndpoint = `/services/data/v52.0/query?q=${encodeURIComponent(totalProfitQuery)}`;
    const totalProfitData = await salesforceRequest('GET', totalProfitEndpoint);
    const totalProfit = totalProfitData.records.length > 0 ? totalProfitData.records[0].totalProfit : 0;

    // console.log('Sending request to Salesforce for cost of goods...');
    const costOfGoodsQuery = `SELECT SUM(Bundle_Price__c) bundlePrice FROM Clothing_Bundles__c WHERE Beneficiary__c='${userId}'`;
    const costOfGoodsEndpoint = `/services/data/v52.0/query?q=${encodeURIComponent(costOfGoodsQuery)}`;
    const costOfGoodsData = await salesforceRequest('GET', costOfGoodsEndpoint);
    const costOfGoods = costOfGoodsData.records.length > 0 ? costOfGoodsData.records[0].bundlePrice : 0;

    // console.log('Sending request to Salesforce for purchase count...');
    const purchaseCountQuery = `SELECT COUNT(Id) purchaseCount FROM Clothing_Bundles__c WHERE Beneficiary__c='${userId}' AND Sales_Status__c='Sold'`;
    const purchaseCountEndpoint = `/services/data/v52.0/query?q=${encodeURIComponent(purchaseCountQuery)}`;
    const purchaseCountData = await salesforceRequest('GET', purchaseCountEndpoint);
    const purchaseCount = purchaseCountData.records.length > 0 ? purchaseCountData.records[0].purchaseCount : 0;

    // console.log('Sending request to Salesforce for count of reserved sales status...');
    const salesStatusReservedQuery = `SELECT COUNT(Id) reservedCount FROM Clothing_Bundles__c WHERE Beneficiary__c='${userId}' AND Sales_Status__c='Reserved'`;
    const salesStatusReservedEndpoint = `/services/data/v52.0/query?q=${encodeURIComponent(salesStatusReservedQuery)}`;
    const salesStatusReservedData = await salesforceRequest('GET', salesStatusReservedEndpoint);
    const reservedCount = salesStatusReservedData.records.length > 0 ? salesStatusReservedData.records[0].reservedCount : 0;

    // console.log('Sending request to Salesforce for sales...');
    const salesQuery = `SELECT SUM(Selling_Price__c) totalSales FROM Clothing_Bundles__c WHERE Beneficiary__c='${userId}'`;
    const salesEndpoint = `/services/data/v52.0/query?q=${encodeURIComponent(salesQuery)}`;
    const salesData = await salesforceRequest('GET', salesEndpoint);
    const totalSales = salesData.records.length > 0 ? salesData.records[0].totalSales : 0;

    /// update this to current items object
    // console.log('Sending request to Salesforce for total quantity of bundle items...');
    const bundleItemsQuery = `SELECT Quantity__c FROM Clothing_Items__c WHERE Clothing_Bundles_Id__c IN (SELECT Id FROM Clothing_Bundles__c WHERE Beneficiary__c='${userId}')`;
    const bundleItemsEndpoint = `/services/data/v52.0/query?q=${encodeURIComponent(bundleItemsQuery)}`;
    const bundleItemsData = await salesforceRequest('GET', bundleItemsEndpoint);

    let totalQuantity = 0;

    bundleItemsData.records.forEach(record => {
      totalQuantity += record.Quantity__c;
    });

    res.json({
      totalProfit,
      costOfGoods,
      purchaseCount,
      reservedCount,
      totalSales,
      totalQuantity
    });
  } catch (error) {
    console.error('Error fetching data from Salesforce:', error.message);
    next(error);
  }
};
