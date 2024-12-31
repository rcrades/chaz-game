import { CoreMessage, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

interface Player {
  name: string;
  introduced: boolean;
}

interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  gameStarted: boolean;
  lastAIMessage: string;
}

let gameState: GameState = {
  players: [],
  currentPlayerIndex: 0,
  gameStarted: false,
  lastAIMessage: '',
};

export async function POST(req: Request) {
  try {
    const { messages }: { messages: CoreMessage[] } = await req.json()

    const enabledMods = messages
      .filter(msg => msg.role === 'system' && msg.content.startsWith('Mods updated'))
      .pop()
      ?.content.split(': ')[1].split(', ') || ['drinking_game']

    // Process the latest user message
    const latestUserMessage = messages.filter(msg => msg.role === 'user').pop();
    if (latestUserMessage) {
      processUserMessage(latestUserMessage.content);
    }

    const systemPrompt = `You are the charismatic and entertaining MC of an AI-powered party game. Your role is to guide players through a fun and engaging experience, asking questions, giving challenges, and keeping the energy high. The following mods are enabled: ${enabledMods.join(', ')}. Adjust your behavior and challenges based on these mods. 

Current players: ${gameState.players.map(p => p.name).join(', ')}
Current player: ${gameState.players[gameState.currentPlayerIndex]?.name || 'Not started'}
Game started: ${gameState.gameStarted}

Remember:

1. If the game hasn't started, ask for player names one by one. Once you have at least two players and all introduced players have confirmed they're ready, start the game.
2. Once the game has started, challenge each player one at a time, in the order they were added.
3. Alternate between different types of challenges based on the enabled mods.
4. Keep track of players' names and use them in your responses.
5. Be encouraging, funny, and maintain a party atmosphere.
6. If players seem to be struggling or not enjoying a particular aspect, adapt and change the game direction.
7. Occasionally introduce fun twists or mini-games to keep things interesting.
8. End the game on a high note, thanking everyone for playing.
9. IMPORTANT: Do not repeat your last message. Always provide new content or challenges.

Last AI message: "${gameState.lastAIMessage}"

Always maintain an upbeat, friendly tone, and be ready to explain rules or repeat instructions if players seem confused. Let's keep this party rolling!`

    const result = streamText({
      model: openai('gpt-4o-mini'),
      apiKey: process.env.OPENAI_API_KEY,
      system: systemPrompt,
      messages: messages.filter(msg => msg.role !== 'system'),
    })

    // Update the last AI message
    result.text.then(text => {
      gameState.lastAIMessage = text;
    });

    return result.toDataStreamResponse()
  } catch (error) {
    if (error.name === 'AbortError') {
      return new Response('Request aborted', { status: 499 }) // 499 is "Client Closed Request"
    }
    console.error('Error in chat route:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

function processUserMessage(message: string) {
  if (!gameState.gameStarted) {
    // Check if the message contains a name (simple check, can be improved)
    const possibleName = message.split(' ').pop();
    if (possibleName && possibleName.length > 1 && !gameState.players.some(p => p.name.toLowerCase() === possibleName.toLowerCase())) {
      gameState.players.push({ name: possibleName, introduced: false });
    } else if (message.toLowerCase().includes('ready')) {
      if (gameState.players.length > 0) {
        gameState.players[gameState.players.length - 1].introduced = true;
      }
      if (gameState.players.length >= 2 && gameState.players.every(p => p.introduced)) {
        gameState.gameStarted = true;
      }
    }
  } else {
    // Move to the next player after each response
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  }
}

