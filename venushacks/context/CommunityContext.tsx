import { createContext, useContext, useState, type ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  author: string;
  body: string;
  timestamp: string;
}

export interface Post {
  id: string;
  authorName: string;
  category: string;
  title: string;
  body: string;
  upvoteCount: number;
  upvoted: boolean;
  comments: Comment[];
}

interface CommunityContextValue {
  posts: Post[];
  toggleUpvote: (postId: string) => void;
  addComment: (postId: string, author: string, body: string) => void;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_POSTS: Post[] = [
  {
    id: '1',
    authorName: 'Maya R.',
    category: 'Postpartum BP',
    title: 'BP spiking to 150s at 3 weeks postpartum — anyone else?',
    body: 'I was totally fine during pregnancy but now at 3 weeks postpartum my readings keep hitting 155/100. My OB said to "keep an eye on it." I feel dismissed. Has anyone dealt with postpartum hypertension and actually gotten treatment? I\'m exhausted and scared.',
    upvoteCount: 47,
    upvoted: false,
    comments: [
      { id: 'c1', author: 'Jordan K.', body: 'Yes! This happened to me at 2 weeks PP. Pushed hard for a 24-hour urine test and they found protein. Got put on labetalol and felt so much better. Don\'t let them dismiss you.', timestamp: '2h ago' },
      { id: 'c2', author: 'Priya S.', body: 'Ask specifically about postpartum preeclampsia. It can develop up to 6 weeks after delivery. The advocacy script in the app helped me frame the conversation with my midwife.', timestamp: '1h ago' },
      { id: 'c3', author: 'Anon Mom', body: 'Same boat. Demand a blood pressure log review. Bring your Kardia data — showing the pattern matters more than any single reading.', timestamp: '45m ago' },
    ],
  },
  {
    id: '2',
    authorName: 'Leila T.',
    category: 'Gestational Diabetes',
    title: 'Low-carb dinner ideas that actually taste good?',
    body: 'I\'m 28 weeks with GDM and my post-dinner glucose keeps spiking no matter what I eat. My dietitian gave me a generic meal plan but I\'m going crazy with the same 4 meals. Anyone have recipes that kept their numbers under 140 mg/dL after meals?',
    upvoteCount: 89,
    upvoted: false,
    comments: [
      { id: 'c4', author: 'Simone W.', body: 'Sheet pan salmon with roasted zucchini and cauliflower rice is my go-to. Post-meal numbers never go above 120 for me. Pair protein with every carb you eat.', timestamp: '3h ago' },
      { id: 'c5', author: 'Fatima O.', body: 'Greek yogurt with berries and chia seeds for dessert! Also — walking for 15 minutes after dinner dropped my readings by almost 20 points consistently.', timestamp: '2h ago' },
    ],
  },
  {
    id: '3',
    authorName: 'Anon Mom',
    category: 'Postpartum Anxiety',
    title: 'Heart palpitations + anxiety at 4 months PP — is this cardiac?',
    body: 'I keep getting these fluttery heart sensations, especially at night. My doctor ran an EKG and said it\'s fine, but I\'m terrified. Is this postpartum anxiety, or should I push for more cardiac workup? I\'m breastfeeding so nervous about any medications.',
    upvoteCount: 63,
    upvoted: false,
    comments: [
      { id: 'c6', author: 'Dr. Mama (RN)', body: 'Palpitations postpartum are really common — hormonal shifts, sleep deprivation, anemia. If EKG is normal, ask about a Holter monitor to rule out arrhythmia over 24 hours.', timestamp: '5h ago' },
      { id: 'c7', author: 'Keisha B.', body: 'I had this exact thing. Turned out my iron was critically low from blood loss during delivery. Getting iron infusions changed everything. Ask for ferritin, not just hemoglobin.', timestamp: '4h ago' },
    ],
  },
  {
    id: '4',
    authorName: 'Serena M.',
    category: 'A1C & Long-Term Health',
    title: 'GDM resolved but A1C crept up at 6-month check — feeling scared',
    body: 'My GDM resolved after delivery but my 6-month A1C just came back at 5.9. My doctor said "borderline prediabetes, just watch your diet." I feel like that\'s not an action plan. What have others done to actually reverse prediabetes after GDM?',
    upvoteCount: 102,
    upvoted: false,
    comments: [
      { id: 'c8', author: 'Nadia F.', body: 'The ADA has a lifestyle change program specifically for GDM survivors. Evidence-based and often covered by insurance. Ask for an endocrinologist referral, not just OB guidance.', timestamp: '6h ago' },
      { id: 'c9', author: 'Chloe V.', body: 'Resistance training 3x a week moved the needle more than cardio for me. Within 6 months my A1C was back at 5.2. Logging your readings consistently really helps you see the pattern.', timestamp: '5h ago' },
      { id: 'c10', author: 'Anon Mom', body: 'A short-term continuous glucose monitor (Libre) was eye-opening — I finally understood which foods were actually spiking me. Ask your doctor for a one-month trial.', timestamp: '3h ago' },
    ],
  },
  {
    id: '5',
    authorName: 'Jasmine C.',
    category: 'Advocacy',
    title: 'Scripts that got my doctor to actually listen — share yours',
    body: 'After 3 months of using the advocacy script from the Translation Engine I finally got a referral to a cardiologist. The key: leading with specific numbers ("my systolic has been above 140 for 6 of the last 8 readings") vs. "I feel off." Data changes everything.',
    upvoteCount: 215,
    upvoted: false,
    comments: [
      { id: 'c11', author: 'Tanya H.', body: 'I was told for months my symptoms were "just new mom stress." When I showed up with a printed trend chart, same doctor ordered an echocardiogram the same day. Bring your data.', timestamp: '8h ago' },
      { id: 'c12', author: 'Rosa D.', body: 'Explicitly saying "I want this documented in my chart" changes the dynamic immediately. Suddenly everything gets taken seriously.', timestamp: '7h ago' },
    ],
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────

const CommunityContext = createContext<CommunityContextValue | null>(null);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);

  function toggleUpvote(postId: string) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, upvoted: !p.upvoted, upvoteCount: p.upvoted ? p.upvoteCount - 1 : p.upvoteCount + 1 }
          : p
      )
    );
  }

  function addComment(postId: string, author: string, body: string) {
    const comment: Comment = {
      id: Date.now().toString(),
      author,
      body,
      timestamp: 'just now',
    };
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
      )
    );
  }

  return (
    <CommunityContext.Provider value={{ posts, toggleUpvote, addComment }}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity(): CommunityContextValue {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error('useCommunity must be used within CommunityProvider');
  return ctx;
}
