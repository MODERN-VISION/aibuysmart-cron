# AIBuySmart Serverless Blog Automation

This serverless function automatically:
- Generates AI blog articles with OpenAI GPT-4
- Posts them to a Notion database
- Sends success/failure alerts via Discord webhook

## Folder Structure
```
aibuysmart-cron/
├── api/
│   └── autoBlog.js          # Main automation logic
├── vercel.json              # Vercel schedule + config
├── .env.local.example       # Env variable template
└── README.md
```

## Setup
1. Rename `.env.local.example` to `.env.local` and add your API keys
2. Deploy to Vercel via GitHub
3. Add environment variables in the Vercel dashboard
4. Done! It will run daily at 8AM UTC
