const db = require('../../src/db');
const mongoose = require('mongoose');

/**
 * beforeAll: initiate db and clear data.
 * beforeEach: clear data.
 * afterAll: close connection.
 * @param {Array<string>} persistCollections Array of collectionNames to persist during beforeEach clear.
 */
const dbSetupAndTearDown = (persistCollections) => {
  beforeAll(async () => {
    await db.init();
    await clearDb();
  });

  beforeEach(async () => {
    await clearDb(persistCollections);
  });

  afterAll(async () => {
    await mongoose.connection.close()
  });
};

async function clearDb(persistCollections = []) {
  await Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => {
    if (collection.collectionName === 'identitycounters') {
      await collection.updateMany({ count: { $gt: 0 } }, { $set: { count: 0 } });
    }
    else {
      if (!~persistCollections.indexOf(collection.collectionName.toLowerCase())) {
        await collection.deleteMany();
      }
    }
  }));
}


module.exports = { dbSetupAndTearDown };

