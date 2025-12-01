import type { NextApiRequest, NextApiResponse } from 'next';
import triviaData from '@/data/trivia.json';

interface TriviaItem {
  country: string;
  period: string;
  question: string;
  answer: string;
  funFact?: string;
}

type ResponseData = {
  items: TriviaItem[];
} | {
  error: string;
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { country, period } = req.query;

    if (!country) {
      return res.status(400).json({ error: 'Country parameter is required' });
    }

    let filtered = triviaData.filter(
      (item: TriviaItem) => item.country.toLowerCase() === (country as string).toLowerCase()
    );

    if (period && period !== 'any' && (period as string).toLowerCase() !== 'any time') {
      filtered = filtered.filter(
        (item: TriviaItem) => item.period === period
      );
    }

    const shuffled = shuffleArray(filtered);

    return res.status(200).json({ items: shuffled });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching trivia' });
  }
}