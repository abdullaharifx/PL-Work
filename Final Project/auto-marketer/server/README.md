# Reddit Outreach API

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/redit-outreach

# For production, use your actual MongoDB URI
# Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/redit-outreach
```

## Development

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Start production server:

```bash
npm start
```
