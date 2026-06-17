import axios from 'axios';

async function main() {
  const address = '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d';
  const faucetUrl = 'https://faucet.testnet.sui.io/v1/gas';

  for (let i = 0; i < 15; i++) {
    try {
      console.log(`[Attempt ${i + 1}] Requesting gas from faucet for: ${address}...`);
      const res = await axios.post(faucetUrl, {
        FixedAmountRequest: {
          recipient: address
        }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      console.log('Success! Faucet Response:', JSON.stringify(res.data, null, 2));
      return;
    } catch (e: any) {
      console.warn(`[Attempt ${i + 1}] Faucet request failed:`, e.message);
      if (e.response && e.response.status === 429) {
        console.log('Rate limited. Waiting 5 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        if (e.response) {
          console.error('Response details:', e.response.data);
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}
main();
