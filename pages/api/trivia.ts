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
    const { countries, period } = req.query;

    if (!countries) {
      return res.status(400).json({ error: 'Countries parameter is required' });
    }

    // Split countries string into array
    const countryList = (countries as string).split(',');

    // Filter by countries
    let filtered = triviaData.filter(
      (item: TriviaItem) => countryList.some(c => 
        item.country.toLowerCase() === c.toLowerCase()
      )
    );

    // Filter by period if specified
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