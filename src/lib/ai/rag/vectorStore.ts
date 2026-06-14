import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { getEmbedderInstance } from './embedder';
import { getVectorsCollection } from '../../db/mongoose';
import { Document } from '@langchain/core/documents';
import type { DataChunk } from './chunker';

/**
 * Initializes and returns a MongoDBAtlasVectorSearch vector store.
 * Configured with the vectors collection, "vector_index" search index,
 * and text/embedding field mappings.
 */
export async function getVectorStore(): Promise<MongoDBAtlasVectorSearch> {
  const collection = await getVectorsCollection();
  const embeddings = getEmbedderInstance();
  
  return new MongoDBAtlasVectorSearch(embeddings, {
    collection: collection as any,
    indexName: 'vector_index',
    textKey: 'text',
    embeddingKey: 'embedding',
  });
}

/**
 * Purges all vector documents from the vectors collection associated with a deleted dataset.
 * Checks both root-level 'datasetId' and nested 'metadata.datasetId' for robustness.
 */
export async function deleteVectorsByDatasetId(datasetId: string): Promise<void> {
  const collection = await getVectorsCollection();
  await collection.deleteMany({
    $or: [
      { datasetId: datasetId },
      { 'metadata.datasetId': datasetId }
    ]
  });
}

/**
 * Builds and persists a vector store from DataChunks.
 */
export async function buildAndPersistVectorStore(
  datasetId: string,
  chunks: DataChunk[]
): Promise<void> {
  const documents = chunks.map((chunk) => {
    return new Document({
      pageContent: chunk.text,
      metadata: {
        datasetId,
        metadata: {
          datasetId,
        },
        startIndex: chunk.metadata.startIndex,
        endIndex: chunk.metadata.endIndex,
      },
    });
  });

  const collection = await getVectorsCollection();
  const embeddings = getEmbedderInstance();
  await MongoDBAtlasVectorSearch.fromDocuments(
    documents,
    embeddings,
    {
      collection: collection as any,
      indexName: 'vector_index',
      textKey: 'text',
      embeddingKey: 'embedding',
    }
  );
}
