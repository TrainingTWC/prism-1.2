// ──────────────────────────────────────────
// Content Moderation Service — Guardrails for Intelligence Hub
// ──────────────────────────────────────────

import { prisma } from '../../lib/prisma.js';

// ═══════════════════════════════════════
//  WORD LISTS
// ═══════════════════════════════════════

// Profanity / cuss words (comprehensive)
const PROFANITY_LIST: string[] = [
  // English
  'fuck', 'shit', 'ass', 'asshole', 'bitch', 'bastard', 'damn', 'dick', 'cock',
  'pussy', 'cunt', 'whore', 'slut', 'nigger', 'nigga', 'faggot', 'fag', 'retard',
  'motherfucker', 'bullshit', 'horseshit', 'dipshit', 'dumbass', 'jackass',
  'piss', 'crap', 'bollocks', 'wanker', 'twat', 'prick', 'douche', 'douchebag',
  'stfu', 'gtfo', 'wtf', 'lmfao',
  // Variations & leetspeak
  'fck', 'fuk', 'fuq', 'f*ck', 'sh*t', 'b*tch', 'a$$', 'a**', 'biatch',
  'mf', 'mofo', 'effing', 'frigging',
  // Hindi/Hinglish profanity
  'bhenchod', 'behenchod', 'bc', 'mc', 'madarchod', 'chutiya', 'chutiye',
  'gaand', 'gandu', 'lund', 'lauda', 'lavda', 'randi', 'harami', 'haramkhor',
  'bhosdike', 'bsdk', 'bhosdi', 'sala', 'saala', 'saali', 'kutta', 'kutti',
  'kamina', 'kamine', 'tatti', 'ullu',
];

// Offensive / controversial terms
const OFFENSIVE_LIST: string[] = [
  'kill', 'murder', 'suicide', 'bomb', 'terrorist', 'terrorism',
  'rape', 'molest', 'abuse', 'violence', 'drugs', 'cocaine', 'heroin',
  'nazi', 'fascist', 'genocide', 'ethnic cleansing',
  'porn', 'pornography', 'xxx', 'nude', 'naked', 'sex',
];

// Competitor brands (F&B / QSR / café chains in India & global)
const COMPETITOR_BRANDS: string[] = [
  'starbucks', 'costa coffee', 'café coffee day', 'ccd', 'blue tokai',
  'third wave coffee', 'tim hortons', "mcdonald's", 'mcdonalds', 'mcd',
  'burger king', 'kfc', 'dominos', "domino's", 'pizza hut', 'subway',
  'dunkin', "dunkin'", 'dunkin donuts', 'taco bell', 'wendys', "wendy's",
  'chick-fil-a', 'popeyes', 'pret a manger', 'chaayos', 'chai point',
  'barista coffee', 'gloria jeans', 'coffee bean', 'caribou coffee',
  'lavazza', 'nescafe', 'bru', 'tata starbucks',
  'haldirams', "haldiram's", 'bikanervala', 'sagar ratna', 'saravana bhavan',
  'wow momo', 'faasos', 'behrouz', 'box8', 'eatfit',
  'zomato', 'swiggy', 'uber eats',
];

// ═══════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════

export type ViolationType =
  | 'PROFANITY'
  | 'OFFENSIVE_LANGUAGE'
  | 'COMPETITOR_MENTION'
  | 'OFF_TOPIC'
  | 'CONTROVERSIAL';

export interface ModerationResult {
  allowed: boolean;
  violations: ViolationType[];
  flaggedTerms: string[];
  censoredMessage: string;
  warningMessage: string | null;
  warningCount: number;
  escalated: boolean;
}

// ═══════════════════════════════════════
//  GLITCH CENSOR
// ═══════════════════════════════════════

// Unicode glitch characters for the "corrupted data" look
const GLITCH_CHARS = ['█', '▓', '░', '▒', '╳', '◈', '◆', '⬡', '⎔', '⏣', '☠', '⚡', '✕'];

function glitchCensor(word: string): string {
  let result = '';
  for (let i = 0; i < word.length; i++) {
    result += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
  }
  return `[${result}]`;
}

// ═══════════════════════════════════════
//  DETECTION ENGINE
// ═══════════════════════════════════════

function buildWordRegex(word: string): RegExp {
  // Escape special regex chars
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'gi');
}

// Known safe words that contain profanity substrings
const SAFE_WORDS: string[] = [
  'mulund', 'analyst', 'analysis', 'analytics', 'analyze', 'class', 'classic',
  'assess', 'assessment', 'assist', 'assistant', 'associate', 'association',
  'assume', 'assumption', 'bass', 'bypass', 'compass', 'crass', 'embassy',
  'grass', 'harassment', 'mass', 'massage', 'massive', 'passage', 'passenger',
  'passive', 'brass', 'sassafras', 'therapist', 'scunthorpe', 'penistone',
  'shitake', 'shiitake', 'cockpit', 'cocktail', 'cockatoo', 'hancock',
  'peacock', 'dickens', 'middlesex', 'essex', 'sussex', 'arsenal',
  'buttress', 'butterfly', 'button', 'butte', 'rebuttal',
  'sextant', 'bisexual', 'sextuple', 'sexton',
  'manipulate', 'manuscript', 'manslaughter',
  'grape', 'drape', 'scrape', 'escape', 'rapeseed', 'trapeze',
  'cochin', 'document', 'documenting', 'documented',
  'kumari', 'kumar', 'thakur', 'pussycat',
  'dickenson', 'dickinson', 'hitchcock',
  'shital', 'shitala', 'kashita',
  'harami', // keep this flagged — it IS a slur in Hindi
];

function isSafeContext(message: string, term: string): boolean {
  const lower = message.toLowerCase();
  // Check if the term appears only as part of a safe word
  for (const safe of SAFE_WORDS) {
    if (safe === term) continue; // skip if the safe word IS the profanity
    if (lower.includes(safe) && safe.includes(term)) {
      // The flagged term is a substring of a known safe word that appears in the message
      // Verify it's not ALSO appearing standalone
      // Remove safe word occurrences and check if the term still appears
      const cleaned = lower.split(safe).join(' '.repeat(safe.length));
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (!regex.test(cleaned)) {
        return true; // term only appears inside the safe word
      }
    }
  }
  return false;
}

function detectTerms(message: string, wordList: string[]): string[] {
  const lower = message.toLowerCase();
  const found: string[] = [];
  for (const word of wordList) {
    // Always use word boundary matching to avoid substring false positives
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    if (regex.test(lower)) {
      // Additional check: is this a false positive inside a safe word?
      if (!isSafeContext(message, word)) {
        found.push(word);
      }
    }
  }
  return [...new Set(found)];
}

function censorMessage(message: string, terms: string[]): string {
  let censored = message;
  // Sort by length descending to censor longer phrases first
  const sorted = [...terms].sort((a, b) => b.length - a.length);
  for (const term of sorted) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    censored = censored.replace(regex, (match) => glitchCensor(match));
  }
  return censored;
}

function isOffTopic(message: string): boolean {
  const lower = message.toLowerCase();

  // Very short messages or greetings are allowed
  if (lower.length < 10) return false;
  const greetings = ['hi', 'hello', 'hey', 'thanks', 'thank you', 'ok', 'okay', 'bye', 'good morning', 'good evening'];
  if (greetings.some((g) => lower.trim() === g)) return false;

  // Off-topic keywords — things clearly not about operations/brand
  const offTopicPatterns = [
    /\b(recipe|cook|bake|ingredient)\b.*\b(home|house|personal)\b/i,
    /\b(movie|film|song|music|game|sport|cricket|football|basketball)\b/i,
    /\b(politics|election|vote|government|minister|modi|congress|bjp|aap)\b/i,
    /\b(religion|hindu|muslim|christian|sikh|temple|mosque|church)\b/i,
    /\b(dating|relationship|girlfriend|boyfriend|tinder|bumble)\b/i,
    /\b(stock market|bitcoin|crypto|nft|invest|trading)\b/i,
    /\b(news|war|conflict|protest)\b/i,
    /\b(write me a|tell me a joke|sing|poem|story)\b/i,
    /\b(hack|crack|bypass|cheat|jailbreak)\b/i,
  ];

  return offTopicPatterns.some((p) => p.test(lower));
}

// ═══════════════════════════════════════
//  MAIN MODERATION FUNCTION
// ═══════════════════════════════════════

export class ModerationService {
  static async moderateMessage(
    message: string,
    companyId: string,
    userName: string,
    userRole: string,
    userId?: string,
  ): Promise<ModerationResult> {
    const violations: ViolationType[] = [];
    let allFlaggedTerms: string[] = [];

    // 1. Check profanity
    const profanityHits = detectTerms(message, PROFANITY_LIST);
    if (profanityHits.length > 0) {
      violations.push('PROFANITY');
      allFlaggedTerms.push(...profanityHits);
    }

    // 2. Check offensive/controversial
    const offensiveHits = detectTerms(message, OFFENSIVE_LIST);
    if (offensiveHits.length > 0) {
      violations.push('OFFENSIVE_LANGUAGE');
      allFlaggedTerms.push(...offensiveHits);
    }

    // 3. Check competitor mentions
    const competitorHits = detectTerms(message, COMPETITOR_BRANDS);
    if (competitorHits.length > 0) {
      violations.push('COMPETITOR_MENTION');
      allFlaggedTerms.push(...competitorHits);
    }

    // 4. Check off-topic
    if (isOffTopic(message)) {
      violations.push('OFF_TOPIC');
    }

    allFlaggedTerms = [...new Set(allFlaggedTerms)];

    // If no violations, allow through
    if (violations.length === 0) {
      return {
        allowed: true,
        violations: [],
        flaggedTerms: [],
        censoredMessage: message,
        warningMessage: null,
        warningCount: 0,
        escalated: false,
      };
    }

    // Censor the message
    const censoredMessage = allFlaggedTerms.length > 0 ? censorMessage(message, allFlaggedTerms) : message;

    // Get previous warning count for this user
    const previousViolations = await prisma.chatViolation.count({
      where: {
        companyId,
        userName,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // last 30 days
      },
    });

    const warningCount = previousViolations + 1;
    const isProfanity = violations.includes('PROFANITY');
    const escalated = isProfanity && warningCount >= 3;

    // Determine severity
    let severity: 'WARNING' | 'SERIOUS' | 'CRITICAL' = 'WARNING';
    if (warningCount >= 3 || violations.includes('OFFENSIVE_LANGUAGE')) severity = 'SERIOUS';
    if (escalated || warningCount >= 5) severity = 'CRITICAL';

    // Determine primary violation type for DB
    const primaryViolation = violations[0];

    // Record the violation
    await prisma.chatViolation.create({
      data: {
        companyId,
        userId,
        userName,
        userRole,
        originalMessage: message,
        censoredMessage,
        violationType: primaryViolation,
        flaggedTerms: allFlaggedTerms,
        severity,
        warningCount,
        escalated,
      },
    });

    // Build warning message
    let warningMessage = '';

    if (isProfanity) {
      if (warningCount === 1) {
        warningMessage = `⚠ SYSTEM ALERT: Inappropriate language detected. Your message has been logged. This is Warning ${warningCount}/3. Further violations will be escalated to HR.`;
      } else if (warningCount === 2) {
        warningMessage = `⛔ FINAL WARNING: This is your ${warningCount}nd recorded violation. One more incident and this will be escalated to your HR department with full chat logs.`;
      } else {
        warningMessage = `🚨 VIOLATION ESCALATED: This incident (violation #${warningCount}) has been flagged and will be reported to HR. Your chat activity log has been recorded for review.`;
      }
    } else if (violations.includes('COMPETITOR_MENTION')) {
      warningMessage = `⚠ BRAND POLICY: PRISM Intelligence is exclusively configured for ${companyId === '00000000-0000-0000-0000-000000000001' ? 'HBPL' : 'your company'} operations. Competitor brand discussions are not permitted. Please rephrase your query around our own brand operations.`;
    } else if (violations.includes('OFF_TOPIC')) {
      warningMessage = `⚠ OFF-TOPIC: PRISM Intelligence is designed solely for operational analytics and company data queries. I can only assist with store performance, employee metrics, program analytics, and company-specific insights.`;
    } else if (violations.includes('OFFENSIVE_LANGUAGE')) {
      warningMessage = `⚠ CONTENT POLICY: Your message contained terms that violate our content policy. This has been logged. Please keep all communications professional.`;
    }

    return {
      allowed: false,
      violations,
      flaggedTerms: allFlaggedTerms,
      censoredMessage,
      warningMessage,
      warningCount,
      escalated,
    };
  }

  /**
   * Get violation history for a user or company
   */
  static async getViolations(companyId: string, options?: { userId?: string; limit?: number }) {
    return prisma.chatViolation.findMany({
      where: {
        companyId,
        ...(options?.userId ? { userId: options.userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    });
  }

  /**
   * Get violation count for a user in the last N days
   */
  static async getUserViolationCount(companyId: string, userName: string, days = 30): Promise<number> {
    return prisma.chatViolation.count({
      where: {
        companyId,
        userName,
        createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
      },
    });
  }
}
