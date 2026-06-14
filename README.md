# DataTalk - Natural Language to Data Visualization

DataTalk is a Retrieval-Augmented Generation (RAG) powered web application designed to translate natural language questions about datasets into structured interactive data visualizations (bar, line, area, pie, and scatter charts) using Google Gemini and MongoDB Atlas.

---

## 🛠️ Architecture Overview

The RAG pipeline coordinates data loading, semantic text splitting, vector searches, and LLM-guided structured outputs:

```
[CSV Upload] ──> [Column Inferences & Casting] ──> [Dataset MongoDB Model]
                                                          │ (isIndexed = false)
                                                          ▼
[First Query] ──> [Row Chunker (50 rows/chunk)] ──> [Gemini text-embedding-001]
                                                          │
                                                          ▼
                                            [MongoDB Atlas Vector Search]
                                                          │ (isIndexed = true)
                                                          ▼
[Subsequent Queries] ──────────────────────────> [Semantic Search (Top-5 Chunks)]
                                                          │
                                                          ▼
                                            [LangChain + Gemini-1.5-Flash]
                                                          │ (Structured JSON Option)
                                                          ▼
                                            [ECharts React Component Canvas]
```

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory and populate the following keys:

```env
# NextAuth Authentication Config
# Generate a secret via: openssl rand -base64 32
AUTH_SECRET=your_auth_secret_key

# MongoDB Connection String (MUST support Atlas cluster for Vector Search)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/datatalk?appName=Cluster0

# Google Gemini API Key
GEMINI_API_KEY=AIzaSy...
```

---

## 🧬 MongoDB Atlas Vector Search Index Configuration

To enable similarity matching over the dataset rows, you must create a Vector Search Index on your MongoDB Atlas cluster:

1. Navigate to **Atlas Database** -> **Search** -> **Create Search Index**.
2. Select **JSON Editor** under **Atlas Vector Search** and click Next.
3. Select the `datatalk` database and the `vectors` collection.
4. Name the index **`vector_index`** (this exact name is required by the backend).
5. Paste the following JSON index definition:

```json
{
  "fields": [
    {
      "numDimensions": 768,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    },
    {
      "path": "metadata.datasetId",
      "type": "filter"
    }
  ]
}
```

6. Click **Next** and then **Create Search Index**. It may take a few minutes for the status to show as Active.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
npm run start
```
