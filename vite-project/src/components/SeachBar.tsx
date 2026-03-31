import { useState } from "react";

interface Props {
  onSearch: (term: string) => void;
}

export default function SearchBar({ onSearch }: Props) {
  const [term, setTerm] = useState("");

  return (
    <input
      placeholder="Search products..."
      value={term}
      onChange={(e) => {
        setTerm(e.target.value);
        onSearch(e.target.value);
      }}
    />
  );
}