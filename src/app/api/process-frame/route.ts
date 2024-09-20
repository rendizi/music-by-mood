import axios from 'axios';
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const spotifyApiUrl = 'https://api.spotify.com/v1/search';

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { frameData } = body;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Based on the person's emotions, people around them, gender, and background, recommend a song. The suggestion should be trendy, nostalgic, or viral on TikTok, and should only include real songs that exist on Spotify. Provide the song title in the original language if it's a non-English song (e.g., Kazakh). The response should only contain the song title, and you must verify the song exists, dont return any other text! Be creative with music" },
              {
                type: "image_url",
                image_url: {
                  "url": frameData,
                },
              },
            ],
          },
        ],
      });

      const musicSuggestion = response.choices[0].message.content || '';
      return NextResponse.json({musicSuggestion})

      const spotifyResponse = await axios.get(`${spotifyApiUrl}?q=${musicSuggestion}&type=track`, {
        headers: { Authorization: `Bearer ${process.env.SPOTIFY_ACCESS_TOKEN}` },
      });

      const track = spotifyResponse.data.tracks.items[0];
      return NextResponse.json({track})

    } catch (error) {
      console.error('Error processing frame:', error);
      return new Response(null, { status: 500, statusText: "Bad Request" });
    }
  
}
