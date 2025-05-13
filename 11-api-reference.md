### Download Abstracts (with Excel Export)

**GET /api/events/:eventId/abstracts/download**

**Query Parameters:**
- `exportMode=excel-single|excel-multi` (optional): Export as Excel. `excel-single` = all reviews in one cell; `excel-multi` = one row per review.
- `category=categoryId` (optional): Filter by category.
- `topic=topicName` (optional): Filter by topic.

**Excel File Naming:**
- `abstracts_{eventName}_{categoryOrTopic}_{singleOrMultiRow}.xlsx`

**Excel Content:**
- Event Name, Abstract ID, Title, Topic, Category, Author Name, Submission Date, Status
- For multi-row: Reviewer Name, Review Date, Review Comments, Review Score
- For single-row: All reviews in a single cell as JSON 