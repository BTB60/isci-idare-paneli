const mongoose = require('mongoose');

async function disconnectIfAny() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect().catch(() => {});
  }
}

/**
 * Sıra ilə yoxlayır: USE_MEMORY_DB → MONGODB_URI → localhost.
 * İnkişafda hamısı uğursuzdursa mongodb-memory-server.
 */
async function connectMongo(logger) {
  mongoose.set('strictQuery', false);
  const isProduction = process.env.NODE_ENV === 'production';
  const rawUri = process.env.MONGODB_URI && process.env.MONGODB_URI.trim();
  const defaultLocal = 'mongodb://127.0.0.1:27017/555_insaat';

  const tryOnce = async (uri, ms = 8000) => {
    await disconnectIfAny();
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: ms,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  };

  if (process.env.USE_MEMORY_DB === '1') {
    logger.warn('USE_MEMORY_DB=1 — birbaşa yaddaşdəki Mongo.');
    return startMemoryMongo(logger);
  }

  const candidates = [];
  if (rawUri) candidates.push({ uri: rawUri, label: 'MONGODB_URI', ms: 12000 });
  if (!rawUri || rawUri.includes('127.0.0.1') || rawUri.includes('localhost')) {
    if (!candidates.some((c) => c.uri === defaultLocal)) {
      candidates.push({ uri: defaultLocal, label: 'localhost', ms: 4000 });
    }
  }

  for (const { uri, label, ms } of candidates) {
    try {
      await tryOnce(uri, ms);
      logger.info(`MongoDB qoşuldu (${label})`);
      return { inMemory: false };
    } catch (e) {
      logger.warn(`Mongo cəhd uğursuz (${label}): ${e.message}`);
    }
  }

  if (isProduction) {
    throw new Error('MongoDB əlaqəsi qurula bilmədi (production).');
  }

  logger.warn('Real Mongo tapılmadı — yaddaşdəki Mongo işə salınır.');
  return startMemoryMongo(logger);
}

async function startMemoryMongo(logger) {
  await disconnectIfAny();
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create({
    instance: {
      launchTimeout: 120000
    }
  });
  await mongoose.connect(mongod.getUri(), {
    serverSelectionTimeoutMS: 60000,
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  global.__mongoMemoryServer = mongod;
  logger.info('In-memory MongoDB hazırdır');
  return { inMemory: true };
}

module.exports = { connectMongo };
