import { getBeneficiaryProducts, getProducts } from '../services/shopifyService.js';
import { getOwnedProducts, getProductItems, getClothingBundleId } from '../services/salesforceService.js';

//fetches all products from shopify vendor
export const getVendorProducts = async (req, res, next) => {
  const { vendor } = req.query;

  if (!vendor) {
    return res.status(400).json({ error: 'Vendor query parameter is required' });
  }

  try {
    const products = await getProducts(vendor);
    const transformedProducts = products.map(product => ({
        id: product.id,
        title: product.title,
        vendor: product.vendor,
        bodyHtml: product.body_html,
        createdAt: new Date(product.created_at).toISOString().split('T')[0],
        status: product.status,
        variants: product.variants.map(variant => ({
          id: variant.id,
          price: variant.price
        }))
      }));
    res.json(transformedProducts);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    next(error);
  }
};

//fetches products belonging to user from salesforce
export const getUserOwnedProducts = async (req, res, next) => {
  const { customerId } = req.params;
  console.log(req);
  //const customerId = '7024877994031' //a01Ad00000Y05MAIAZ - grace, newZap - a01Ad00000XUnJdIAL

  if (!customerId) {
    return res.status(400).json({ error: 'Beneficiary ID is required' });
  }

  try {
    // console.log('pre get owned products');
    const products = await getBeneficiaryProducts(customerId);  //Call shopify service to fetch orders
    // console.log('post get owned products');
    // console.log("ProductsAll",products)
    const productItemsPromises = products.map(async (product) => {
      // console.log("Product",product)
      const items = await getProductItems(product.id);
      const clothingBundlesId = await getClothingBundleId(product.id);
      return {
        ...product,
        items,
        clothingBundlesId
      };
    });
    // console.log('pre await');
    const productsWithItems = await Promise.all(productItemsPromises);
    // console.log('post await');

    res.json(productsWithItems);

    //todo: filter product ids. then use to get items data and transform result


  } catch (error) {
    console.error('Error fetching user owned products:', error.message);
    next(error);
  }
};