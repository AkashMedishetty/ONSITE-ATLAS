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

### POST /api/events/:eventId/emails/send
Send an email to filtered recipients for an event. Now supports attachments.

**Request (with attachments):**
- Content-Type: multipart/form-data
- Fields:
  - `email`: JSON string with subject and body
  - `filters`: JSON string with filter criteria
  - `attachments`: One or more files (PDF, images, etc.)

**Request (without attachments):**
- Content-Type: application/json
- Body:
  - `email`: { subject, body }
  - `filters`: { ... }

**Response:**
- Success/failure status, number of recipients, and email batch info

**Notes:**
- Attachments are tracked in email history for audit, and can be viewed/downloaded from the history tab in the admin UI.
- Supported file types and size limits will be enforced in a future update. 