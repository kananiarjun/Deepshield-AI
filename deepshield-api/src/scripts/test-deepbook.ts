import { SuiClient } from '@mysten/sui/client';

async function main() {
  const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
  const packageId = '0xfb28c4cbc6865bd1c897d26aecbe1f8792d1509a20ffec692c800660cbec6982';
  try {
    const events = await client.queryEvents({
      query: { MoveEventType: `${packageId}::order_info::OrderFilled` },
      limit: 10
    });
    console.log('OrderFilled events count:', events.data.length);
    if (events.data.length > 0) {
      console.log('First event:', JSON.stringify(events.data[0], null, 2));
    }
  } catch (e) {
    console.error(e);
  }
}
main();
