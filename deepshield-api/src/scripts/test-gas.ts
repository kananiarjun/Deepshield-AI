import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
  const keyStr = process.env.SUI_PRIVATE_KEY;
  if (!keyStr) {
    console.error('No SUI_PRIVATE_KEY found in .env');
    return;
  }

  try {
    const keypair = Ed25519Keypair.fromSecretKey(keyStr);
    const address = keypair.toSuiAddress();
    console.log('Admin Address:', address);
    
    const balance = await client.getBalance({ owner: address });
    console.log('Balance:', JSON.stringify(balance, null, 2));
    const suiAmount = Number(balance.totalBalance) / 1e9;
    console.log(`Formatted Balance: ${suiAmount} SUI`);
  } catch (e) {
    console.error('Error:', e);
  }
}
main();
