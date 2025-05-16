
import { Configuration, OpenAIApi } from 'openai';
import { Client as NotionClient } from '@notionhq/client';
import fetch from 'node-fetch';

const notion = new NotionClient({ auth: process.env.NOTION_TOKEN });
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));
const NOTION_DB_ID = process.env.NOTION_DATABASE_ID;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function getTrendingTopic() {
  const topics = ["Top AI tools in 2025", "How AI is reshaping e-commerce", "Best GPT apps for businesses"];
  return topics[Math.floor(Math.random() * topics.length)];
}

async function generateBlogPost(topic) {
  const prompt = `Act as a tech blogger. Write a high-quality blog post about the trending AI topic: "${topic}". Include:
- A compelling title
- A 1–2 sentence summary
- Full blog content (minimum 400 words)
Format as HTML.`;

  const res = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 1200
  });

  return res.data.choices[0].message.content;
}

async function postToNotion({ title, summary, html }) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return await notion.pages.create({
    parent: { database_id: NOTION_DB_ID },
    properties: {
      Title: { title: [{ text: { content: title } }] },
      Slug: { rich_text: [{ text: { content: slug } }] },
      Summary: { rich_text: [{ text: { content: summary } }] },
      Date: { date: { start: new Date().toISOString() } },
      Published: { checkbox: true }
    },
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: html.slice(0, 2000) } }]
        }
      }
    ]
  });
}

async function notifyDiscord(message) {
  if (!DISCORD_WEBHOOK_URL) return;
  await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message })
  });
}

export default async function handler(req, res) {
  try {
    const topic = await getTrendingTopic();
    const blog = await generateBlogPost(topic);

    const titleMatch = blog.match(/<h1>(.*?)<\/h1>/);
    const summaryMatch = blog.match(/<p>(.*?)<\/p>/);

    const title = titleMatch ? titleMatch[1] : topic;
    const summary = summaryMatch ? summaryMatch[1] : "AI insights from AIBuySmart.";

    await postToNotion({ title, summary, html: blog });

    console.log(`✅ Blog posted to Notion: ${title}`);
    await notifyDiscord(`✅ New AI blog posted: **${title}**`);
    res.status(200).json({ success: true, title });
  } catch (err) {
    console.error("❌ Blog post failed:", err);
    await notifyDiscord(`❌ Blog post failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
}
