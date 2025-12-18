'use client';

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
}

export default function RatingInput({ value, onChange }: RatingInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Overall Rating
      </label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(rating => (
          <button
            key={rating}
            onClick={() => onChange(rating)}
            className={`w-12 h-12 rounded-lg font-bold transition-colors ${
              value >= rating
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}
