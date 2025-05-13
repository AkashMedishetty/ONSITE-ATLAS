### Abstracts Download Endpoint

**GET /api/events/:eventId/abstracts/download**

**Query Parameters:**
- `exportMode=excel-single|excel-multi` (optional): Export abstracts as Excel. `excel-single` puts all reviews in a single cell per abstract; `excel-multi` creates one row per review.
- `category=categoryId` (optional): Filter abstracts by category.
- `topic=topicName` (optional): Filter abstracts by topic.

**Excel File Naming:**
- `abstracts_{eventName}_{categoryOrTopic}_{singleOrMultiRow}.xlsx`
- If no category/topic filter: `abstracts_{eventName}_all_{singleOrMultiRow}.xlsx`

**Excel Content:**
- Columns: Event Name, Abstract ID, Title, Topic, Category, Author Name, Submission Date, Status
- For multi-row: Reviewer Name, Review Date, Review Comments, Review Score (one row per review)
- For single-row: All reviews in a single cell as JSON (with reviewer name and date) 