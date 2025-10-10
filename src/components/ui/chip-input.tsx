'use client';

import React, { useState, KeyboardEvent } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Badge } from './badge';
import { X } from 'lucide-react';

interface ChipInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function ChipInput({ value, onChange, placeholder }: ChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const chips = Array.isArray(value) ? value : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value.toUpperCase());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addChip();
    }
  };

  const addChip = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !chips.includes(trimmedValue)) {
      onChange([...chips, trimmedValue]);
      setInputValue('');
    }
  };

  const removeChip = (chipToRemove: string) => {
    onChange(chips.filter((chip) => chip !== chipToRemove));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {chips.map((chip) => (
          <Badge key={chip} variant="secondary">
            {chip}
            <button
              type="button"
              className="ml-2 rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => removeChip(chip)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Add a value'}
        />
        <Button type="button" variant="outline" onClick={addChip}>
          Add
        </Button>
      </div>
    </div>
  );
}
