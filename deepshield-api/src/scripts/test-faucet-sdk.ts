import { requestSuiFromFaucetV1, getFaucetHost } from '@mysten/sui/faucet';

async function main() {
  const address = '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d';
  try {
    console.log('Requesting Sui via SDK helper...');
    const res = await requestSuiFromFaucetV1({
      recipient: address,
      host: getFaucetHost('testnet'),
    });
    console.log('SDK Faucet Response:', JSON.stringify(res, null, 2));
  } catch (e: any) {
    console.error('SDK Faucet failed:', e.message || e);
  }
}
main();
