import Dexie, { type EntityTable } from 'dexie';

interface User {
  id: number;
  email: string;
  password: string; // Stored in plain text for this mock/demo as requested
  username: string;
  onboardingComplete: boolean;
}

interface Team {
  id: number;
  userId: number;
  gameTitle: 'League of Legends' | 'VALORANT';
  roster: string[]; // Array of IGNs
  strategy: {
    aggression: number;
    resourcePriority: number;
    visionInvestment: number;
    earlyGamePathing: boolean;
    objectiveControl: boolean;
  };
}

const db = new Dexie('MetaCoachDB') as Dexie & {
  users: EntityTable<User, 'id'>;
  teams: EntityTable<Team, 'id'>;
};

db.version(1).stores({
  users: '++id, &email, username',
  teams: '++id, userId, gameTitle'
});

export type { User, Team };
export { db };
