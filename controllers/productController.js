import { getBeneficiaryProducts, getProducts,getCategorizedProducts } from '../services/shopifyService.js';
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

export const getVendorAndCategoryProducts = async (req, res, next) => {
  const { vendor, product_type } = req.query;

  if (!product_type || !vendor) {
    return res.status(400).json({ error: 'All query parameters are required' });
  }

  try {
    const products = await getCategorizedProducts(vendor, product_type);
    
    const transformedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      vendor: product.vendor,
      productType: product.product_type,
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
  //console.log(req);

  if (!customerId) {
    return res.status(400).json({ error: 'Beneficiary ID is required' });
  }

  try {
    const products = await getBeneficiaryProducts(customerId);
    const productItemsPromises = products.map(async (product) => {
      const items = await getProductItems(product.id);
      const clothingBundlesIds = await getClothingBundleId(product.id);
      return {
        ...product,
        items,
        clothingBundlesIds
      };
    });
    const productsWithItems = await Promise.all(productItemsPromises);

    res.json(productsWithItems);

  } catch (error) {
    console.error('Error fetching user owned products:', error.message);
    next(error);
  }
};
