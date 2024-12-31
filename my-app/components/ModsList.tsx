import { useState } from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Mod {
  id: string;
  name: string;
  enabled: boolean;
}

const initialMods: Mod[] = [
  { id: "drinking_game", name: "Drinking Game", enabled: true },
  { id: "exercise_challenges", name: "Add Exercise Challenges", enabled: false },
  { id: "add_water", name: "Add Water", enabled: false },
  { id: "tongue_twisters", name: "Add Tongue Twisters", enabled: false },
  { id: "food_challenges", name: "Add Food Challenges", enabled: false },
  { id: "easy_ai", name: "Easy-going AI (Easy Challenges)", enabled: false },
  { id: "hard_ai", name: "Hard AI (Difficult Challenges)", enabled: false },
  { id: "inquisitive_ai", name: "Inquisitive AI (Customized Games)", enabled: false },
  { id: "truth_or_dare", name: "Truth or Dare", enabled: false },
  { id: "karaoke_challenges", name: "Karaoke Challenges", enabled: false },
  { id: "movie_quotes", name: "Movie Quote Challenges", enabled: false },
  { id: "dance_offs", name: "Dance-Off Challenges", enabled: false },
  { id: "trivia_master", name: "Trivia Master", enabled: false },
  { id: "would_you_rather", name: "Would You Rather", enabled: false },
  { id: "impressions", name: "Celebrity Impressions", enabled: false },
  { id: "charades", name: "Charades", enabled: false },
  { id: "storytelling", name: "Collaborative Storytelling", enabled: false },
  { id: "riddles", name: "Riddles and Brain Teasers", enabled: false },
  { id: "accent_challenge", name: "Accent Challenge", enabled: false },
  { id: "lip_sync_battles", name: "Lip Sync Battles", enabled: false },
  { id: "dare_devil", name: "Dare Devil (Risky Challenges)", enabled: false },
  { id: "rapid_fire", name: "Rapid Fire Questions", enabled: false },
  { id: "memory_game", name: "Memory Game Challenges", enabled: false },
  { id: "physical_comedy", name: "Physical Comedy Challenges", enabled: false },
  { id: "pun_master", name: "Pun Master", enabled: false },
  { id: "emoji_translator", name: "Emoji Translator", enabled: false },
  { id: "reverse_charades", name: "Reverse Charades", enabled: false },
  { id: "musical_challenges", name: "Musical Challenges", enabled: false },
  { id: "blindfolded_tasks", name: "Blindfolded Tasks", enabled: false },
  { id: "team_challenges", name: "Team Challenges", enabled: false },
  { id: "debate_club", name: "Impromptu Debate Club", enabled: false },
  { id: "time_travel", name: "Time Travel Scenarios", enabled: false },
  { id: "silent_challenge", name: "Silent Challenge", enabled: false },
  { id: "compliment_battle", name: "Compliment Battle", enabled: false },
  { id: "roast_master", name: "Roast Master (Friendly Roasts)", enabled: false },
  { id: "accent_roulette", name: "Accent Roulette", enabled: false },
  { id: "lyric_challenge", name: "Finish the Lyric Challenge", enabled: false },
  { id: "mime_time", name: "Mime Time", enabled: false },
  { id: "tongue_twister_race", name: "Tongue Twister Race", enabled: false },
  { id: "fictional_scenarios", name: "Fictional Scenarios", enabled: false },
  { id: "celebrity_hot_seat", name: "Celebrity Hot Seat", enabled: false },
  { id: "rhythm_challenge", name: "Rhythm Challenge", enabled: false },
  { id: "word_association", name: "Rapid Word Association", enabled: false },
  { id: "art_challenge", name: "60-Second Art Challenge", enabled: false },
  { id: "sports_commentary", name: "Sports Commentary", enabled: false },
  { id: "magic_show", name: "Impromptu Magic Show", enabled: false },
  { id: "fashion_show", name: "Impromptu Fashion Show", enabled: false },
  { id: "commercial_break", name: "Create a Commercial", enabled: false },
  { id: "animal_impressions", name: "Animal Impressions", enabled: false },
  { id: "superhero_scenarios", name: "Superhero Scenarios", enabled: false },
  { id: "whisper_challenge", name: "Whisper Challenge", enabled: false },
  { id: "news_anchor", name: "Fake News Anchor", enabled: false },
  { id: "slow_motion", name: "Slow Motion Challenge", enabled: false },
  { id: "poetry_slam", name: "Impromptu Poetry Slam", enabled: false },
  { id: "voice_acting", name: "Voice Acting Challenge", enabled: false },
  { id: "human_knot", name: "Human Knot Challenge", enabled: false },
  { id: "balloon_challenge", name: "Balloon Challenge", enabled: false },
  { id: "paper_airplane", name: "Paper Airplane Contest", enabled: false },
]

interface ModsListProps {
  onModsChange: (mods: Mod[]) => void;
}

export function ModsList({ onModsChange }: ModsListProps) {
  const [mods, setMods] = useState<Mod[]>(initialMods);

  const handleModToggle = (id: string) => {
    const updatedMods = mods.map(mod => 
      mod.id === id ? { ...mod, enabled: !mod.enabled } : mod
    );
    setMods(updatedMods);
    onModsChange(updatedMods);
  };

  return (
    <ScrollArea className="h-[300px] w-full rounded-md border p-4">
      <div className="space-y-4">
        {mods.map((mod) => (
          <div key={mod.id} className="flex items-center space-x-2">
            <Checkbox
              id={mod.id}
              checked={mod.enabled}
              onCheckedChange={() => handleModToggle(mod.id)}
            />
            <Label htmlFor={mod.id}>{mod.name}</Label>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

