import axios from 'axios';

async function main() {
  const publisher = 'https://publisher.walrus-testnet.walrus.space';
  const aggregator = 'https://aggregator.walrus-testnet.walrus.space';
  const testData = {
    test: true,
    message: "DeepShield AI integration test",
    timestamp: Date.now()
  };

  try {
    console.log('1. Uploading test data to Walrus Publisher...');
    const putRes = await axios.put(
      `${publisher}/v1/blobs?epochs=1`,
      JSON.stringify(testData),
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );
    console.log('Upload Response:', JSON.stringify(putRes.data, null, 2));

    let blobId = '';
    if (putRes.data.alreadyCertified) {
      blobId = putRes.data.alreadyCertified.blobId;
    } else if (putRes.data.newlyCreated) {
      blobId = putRes.data.newlyCreated.blobObject.blobId;
    }

    console.log('Retrieved Blob ID:', blobId);

    if (blobId) {
      console.log('2. Downloading data from Walrus Aggregator...');
      // Wait 3 seconds for propagation
      await new Promise(resolve => setTimeout(resolve, 3000));
      const getRes = await axios.get(`${aggregator}/v1/${blobId}`, { timeout: 10000 });
      console.log('Aggregated Data:', JSON.stringify(getRes.data, null, 2));
    }
  } catch (e: any) {
    console.error('Walrus error:', e.message || e);
    if (e.response) {
      console.error('Response data:', e.response.data);
    }
  }
}
main();
