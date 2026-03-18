# Bass Practice App

AI-powered worship bass charts, tabs, and play-along tool.

## Deploy to Vercel (same workflow as LIV)

1. Create a new GitHub repo called `bass-practice`
2. Push this code to it
3. Go to vercel.com → New Project → import the repo
4. In Vercel project settings → Environment Variables, add:
   - (No API key needed — the app uses the Claude.ai proxy)
5. Deploy — done!

## Local dev

```bash
npm install
npm start
```

## Features

- Search any worship song by title + artist
- AI generates full chord chart with section breakdown
- Bass tab with string notation per section
- Player notes: feel, root notes, dynamics, tips
- Key transposer (±semitones)
- Adjustable BPM tempo slider
- Play-along mode highlights current chord
- Save favorites to device (localStorage)
