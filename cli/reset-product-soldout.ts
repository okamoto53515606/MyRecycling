import 'dotenv/config';
import { getAdminDb } from '../src/lib/firebase-admin';

const productId = process.argv[2];

if (!productId) {
  console.error('Usage: npx tsx cli/reset-product-soldout.ts <productId>');
  process.exit(1);
}

const db = getAdminDb();

async function resetProduct() {
  const productRef = db.collection('products').doc(productId);
  const productDoc = await productRef.get();
  
  if (!productDoc.exists) {
    console.error(`Product ${productId} not found`);
    process.exit(1);
  }
  
  await productRef.update({ isSoldOut: false });
  console.log(`Product ${productId} isSoldOut has been reset to false`);
}

resetProduct().catch(console.error);
