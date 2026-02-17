import { randomUUID } from 'crypto';
import { hashSync } from 'bcryptjs';
import { getDb, closeDb } from '../src/db/connection.js';

interface SeedUser {
  username: string;
  displayName: string;
}

const SEED_USERS: SeedUser[] = [
  { username: 'luna_writes', displayName: 'Luna' },
  { username: 'maxcooks', displayName: 'Max Chen' },
  { username: 'outdoorskid', displayName: 'Jamie Rivera' },
  { username: 'cassreads', displayName: 'Cass' },
  { username: 'theo.thoughts', displayName: 'Theo Park' },
];

const SAMPLE_POSTS: { title: string; content: string }[] = [
  { title: 'Just moved to a new city', content: 'Everything feels different here. The coffee shops close at 8pm and everyone bikes everywhere. I think I love it.' },
  { title: 'Hot take: pineapple on pizza is fine', content: 'I said what I said. The sweetness balances the salt. You\'re all just afraid of flavor.' },
  { title: 'My cat learned to open doors', content: 'No room is safe anymore. She figured out lever handles last week and now she just wanders in wherever she pleases. Privacy is dead.' },
  { title: 'Best album of the year?', content: 'Looking for recommendations. I\'ve been stuck in a loop listening to the same three albums and I need something fresh.' },
  { title: 'Tried cooking risotto for the first time', content: 'Stood at the stove stirring for 45 minutes. It turned out okay but I think I understand why restaurants charge so much for it now.' },
  { title: 'Unpopular opinion about remote work', content: 'I actually miss the office sometimes. Not the commute, but the random conversations by the coffee machine that led to interesting ideas.' },
  { title: 'My garden is thriving', content: 'The tomatoes are finally coming in. There\'s something deeply satisfying about eating food you grew yourself, even if it took months of patience.' },
  { title: 'Just finished a 1000 piece puzzle', content: 'It took three weeks and I almost gave up twice, but the sense of accomplishment when that last piece clicked in was unreal.' },
  { title: 'Learning to play guitar at 30', content: 'My fingers hurt, I can only play three chords, and my neighbors probably hate me. But I\'m having the time of my life.' },
  { title: 'Found the best taco truck', content: 'It\'s parked behind a gas station on 5th street and it has no sign. The al pastor is life-changing. Some things are worth the hunt.' },
  { title: 'Why does nobody talk about how hard adulting is?', content: 'Taxes, insurance, meal planning, remembering to schedule dentist appointments... someone should have warned us more aggressively.' },
  { title: 'My dog met a cat today', content: 'He didn\'t know what to do. Just stood there, tail wagging nervously, while the cat stared him down. The cat won.' },
  { title: 'Started journaling again', content: 'Forgot how therapeutic it is to just dump your thoughts on paper. No algorithm, no likes, just you and your messy handwriting.' },
  { title: 'Book recommendation thread', content: 'Just finished "Project Hail Mary" and I need something to fill the void. Science fiction preferred but I\'m open to anything.' },
  { title: 'Rainy days are underrated', content: 'There\'s nothing better than rain on the window, a warm drink, and nowhere to be. Today was one of those days.' },
  { title: 'I ran my first 5K', content: 'Finished in 32 minutes which apparently isn\'t fast but I don\'t care. Six months ago I couldn\'t run to the mailbox. Progress is progress.' },
  { title: 'The sunrise this morning', content: 'Woke up way too early but caught the most incredible orange and purple sky. Sometimes insomnia gives you unexpected gifts.' },
  { title: 'Trying to learn a new language', content: 'Week 3 of Japanese. I can introduce myself and count to ten. At this rate I\'ll be conversational by 2045.' },
  { title: 'Controversial food take', content: 'Cereal is better as a late night snack than as breakfast. There, I said it. Breakfast cereal is a lie we were all sold.' },
  { title: 'Just adopted a rescue dog', content: 'He\'s scared of everything - the vacuum, the TV, his own reflection. But when he finally fell asleep in my lap tonight, all of it was worth it.' },
  { title: 'Weekend project went sideways', content: 'Tried to build a bookshelf. Ended up with something that leans slightly to the left. I\'m calling it "artisanal" and moving on.' },
  { title: 'Best coffee I\'ve ever had', content: 'This tiny shop in the market roasts their own beans. The barista spent five minutes explaining the origin of each blend. Worth every second.' },
  { title: 'Finally watched that show everyone talks about', content: 'Okay fine, it\'s actually good. I held out for two years being contrarian for no reason. The hype was justified.' },
  { title: 'Bike commuting update', content: 'Month two of biking to work. I\'m faster, my legs are sore, and I\'ve almost been doored three times. Mixed results overall.' },
  { title: 'Thought about starting a podcast', content: 'Then I realized I don\'t have anything interesting to say that isn\'t already being said by ten thousand other podcasts. Self-awareness wins again.' },
  { title: 'My sourdough starter is alive', content: 'After four failed attempts over two years, I finally have a living, bubbling sourdough starter. I\'ve named her Dough-rothy. First loaf tomorrow.' },
  { title: 'Staying up too late again', content: 'There\'s something about the quiet of 2am that makes you feel like you have the whole world to yourself. Terrible for productivity though.' },
  { title: 'Nostalgia hit hard today', content: 'Found my old Game Boy in a box while cleaning. Turned it on and the save file for Pokemon Blue was still there. 1999 me would be proud.' },
  { title: 'The best thing about working from home', content: 'Nobody can see that I\'m wearing pajama pants during meetings. Professional on top, cozy on bottom. The mullet of outfits.' },
  { title: 'Learned something new today', content: 'Octopuses have three hearts and blue blood. Sometimes random facts are the best part of going down an internet rabbit hole.' },
  { title: 'My neighbor started a garden too', content: 'Now we\'re in an unspoken competition over who has better tomatoes. I refuse to lose this. Ordering better fertilizer tonight.' },
  { title: 'Trying meditation', content: 'Day 5. I\'m supposed to clear my mind but instead I just think about all the things I should be doing instead of sitting here. Is that normal?' },
  { title: 'Street food adventures', content: 'Went to the night market downtown. Had the best dumplings of my life from a stall run by a grandmother who didn\'t speak English. Food is universal.' },
  { title: 'Home office upgrade complete', content: 'New monitor, better chair, a plant that I will probably forget to water. The setup looks great. Now I just need motivation to match.' },
  { title: 'Rediscovered an old hobby', content: 'Used to draw all the time as a kid. Picked up a sketchbook again last week and it\'s like muscle memory. Rusty but still there.' },
  { title: 'Why are good avocados so hard to find?', content: 'They go from rock hard to brown mush in about a 6-hour window. You basically need to stake out the grocery store to catch them at peak ripeness.' },
  { title: 'Road trip planning', content: 'Three friends, one car, five days, zero plan. Either this will be the best week ever or we\'ll never speak again. Probably both.' },
  { title: 'Late night cooking experiment', content: 'Made a grilled cheese with brie and fig jam at midnight. It was either genius or unhinged. The answer is both.' },
  { title: 'Morning routine changes', content: 'Started waking up an hour earlier to read before work. It\'s only been a week but I already feel more human. Who knew mornings could be peaceful?' },
  { title: 'Found a great hiking trail', content: 'Only 20 minutes from my apartment and I never knew it existed. Two hours in the woods and all my stress evaporated. Nature is free therapy.' },
  { title: 'Thrift store treasure', content: 'Found a vintage leather jacket for twelve dollars. It fits perfectly. Sometimes the universe just hands you a win.' },
  { title: 'Cooking for one is an art', content: 'The key is making enough for four and eating leftovers all week. Meal prep disguised as laziness. Modern efficiency.' },
  { title: 'Why is parallel parking so stressful?', content: 'I have a degree. I pay taxes. I can cook a decent meal. But put me in front of a tight parking spot and I become a different person entirely.' },
  { title: 'Movie night recommendation', content: 'If you haven\'t seen "Everything Everywhere All at Once" yet, stop what you\'re doing. It\'s the best thing I\'ve watched in years.' },
  { title: 'Started volunteering', content: 'Helping at the local food bank on weekends. It\'s humbling, it\'s rewarding, and it puts everything in perspective. Highly recommend.' },
  { title: 'The art of doing nothing', content: 'Sat on my porch for an hour today with no phone, no book, no plan. Just watched the clouds. It felt revolutionary and that says something about our culture.' },
  { title: 'First time making homemade pasta', content: 'Flour everywhere. Dough stuck to the counter. Rolling it thin enough was a workout. But the final product? Absolutely worth the chaos.' },
  { title: 'My plant collection is getting out of hand', content: 'Started with one succulent. Now I have seventeen plants and I\'m eyeing a fiddle leaf fig. This is how it happens, isn\'t it?' },
  { title: 'Caught the sunset from the rooftop', content: 'The city looks completely different bathed in golden light. For about fifteen minutes, everything felt still and perfect.' },
  { title: 'Random act of kindness today', content: 'Someone paid for my coffee in the drive-through. Passed it forward to the next person. Small things ripple outward.' },
  { title: 'Trying to read more this year', content: 'Goal is 24 books. Currently on book 3 and it\'s February. Math says I\'m on track. Motivation says we\'ll see.' },
  { title: 'Board game night revival', content: 'Got friends together for Settlers of Catan. Friendships were tested, alliances were broken, and someone flipped the board. 10/10 evening.' },
  { title: 'Learning to slow down', content: 'Everything doesn\'t need to be optimized. Sometimes a walk with no destination is exactly what you need. Not everything is a productivity hack.' },
  { title: 'The neighborhood stray cat chose me', content: 'She\'s been showing up at my door every morning for a week. I bought cat food "just in case." I think I have a cat now.' },
  { title: 'Farmers market finds', content: 'Fresh strawberries, homemade jam, a loaf of bread still warm from the oven. Saturday mornings at the market are my happy place.' },
  { title: 'Why are sunsets always better shared?', content: 'Watched an incredible one alone tonight. Beautiful, but something about it made me wish someone else was seeing it too.' },
  { title: 'Apartment hunting nightmare', content: 'Toured six places today. One had no kitchen counter. Another had a shower in the kitchen. The housing market is a comedy of horrors.' },
  { title: 'Just discovered a new band', content: 'They have three albums and zero mainstream recognition. Being early to something good feels like finding buried treasure.' },
  { title: 'Thanksgiving leftovers update', content: 'Day 4. The turkey is gone. The stuffing survives. I\'ve made three different sandwiches. This is peak post-holiday living.' },
  { title: 'Life update: things are good', content: 'Nothing dramatic. No big news. Just a quiet Tuesday where everything felt okay. Those days deserve recognition too.' },
];

async function generateSeed() {
  const db = getDb();
  const passwordHash = hashSync('password123', 10);

  // Upsert seed users
  const seedUserIds: string[] = [];

  for (const { username, displayName } of SEED_USERS) {
    const existing = await db
      .selectFrom('users')
      .select('id')
      .where('username', '=', username)
      .executeTakeFirst();

    if (existing) {
      seedUserIds.push(existing.id);
      continue;
    }

    const id = randomUUID();
    seedUserIds.push(id);
    await db
      .insertInto('users')
      .values({
        id,
        email: `${username}@example.com`,
        username,
        display_name: displayName,
        avatar_url: null,
        password_hash: passwordHash,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .execute();
  }

  console.log(`${seedUserIds.length} seed users ready`);

  // Get user info for denormalized fields
  const seedUsers = await db
    .selectFrom('users')
    .selectAll()
    .where('id', 'in', seedUserIds)
    .execute();
  const userMap = new Map(seedUsers.map((u) => [u.id, u]));

  // Insert posts
  const now = Date.now();
  let inserted = 0;

  for (let i = 0; i < SAMPLE_POSTS.length; i++) {
    const { title, content } = SAMPLE_POSTS[i];
    const createdAt = new Date(now - i * 30 * 60 * 1000).toISOString();
    const id = randomUUID();
    const creatorId = seedUserIds[i % seedUserIds.length];
    const creator = userMap.get(creatorId)!;

    await db
      .insertInto('posts')
      .values({
        id,
        title,
        content,
        creator_id: creatorId,
        creator_username: creator.username,
        creator_display_name: creator.display_name,
        created_at: createdAt,
        updated_at: createdAt,
        deleted_at: null,
      })
      .execute();
    inserted++;
  }

  console.log(`Seeded ${inserted} posts across ${seedUserIds.length} users`);
  await closeDb();
}

generateSeed().catch((err) => {
  console.error('Seed failed:', err);
  closeDb().then(() => process.exit(1));
});
