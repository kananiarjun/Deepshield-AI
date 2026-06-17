import axios from 'axios';

async function main() {
  const aggregator = 'https://aggregator.walrus-testnet.walrus.space';
  const blobId = 'ffdTqcT8qyTQMym98vxwVoCsUl76NEImrBRgKkB1cNM';

  try {
    const getRes = await axios.get(`${aggregator}/v1/blobs/${blobId}`, { timeout: 10000 });
    console.log('Success! Data:', JSON.stringify(getRes.data, null, 2));
  } catch (e: any) {
    console.error('Download failed:', e.message);
  }
}
main();
