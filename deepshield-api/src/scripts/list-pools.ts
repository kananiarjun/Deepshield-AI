import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { DeepBookClient } from '@mysten/deepbook';

async function main() {
  const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
  const deepbook = new DeepBookClient(client);
  try {
    const pools = await deepbook.getAllPools({});
    console.log('DeepBook Pools:', JSON.stringify(pools, null, 2));
  } catch (e) {
    console.error('Error fetching pools:', e);
  }
}
main();
