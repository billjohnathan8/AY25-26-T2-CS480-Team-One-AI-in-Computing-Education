import { useState } from "react";

interface ImportCardProps {
  title: string;
  description: string;
  sample: string;
  onImport: (payload: unknown) => Promise<unknown>;
}

function tryParseInput(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    throw new Error("JSON payload must be an array");
  } catch {
    // fallback CSV parser
    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) return [];
    const [headerLine, ...rows] = lines;
    const headers = headerLine.split(",").map((h) => h.trim());
    return rows.map((row) => {
      const values = row.split(",");
      return headers.reduce<Record<string, string>>((acc, header, index) => {
        acc[header] = values[index]?.trim() ?? "";
        return acc;
      }, {});
    });
  }
}

const ImportCard = ({ title, description, sample, onImport }: ImportCardProps) => {
  const [value, setValue] = useState<string>(sample);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    setStatus("");
    try {
      const payload = tryParseInput(value);
      await onImport(payload);
      setStatus("Import successful");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <header>
        <h3>{title}</h3>
        <p>{description}</p>
      </header>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={6}
        spellCheck={false}
      />
      <button onClick={handleImport} disabled={loading}>
        {loading ? "Processing..." : "Import"}
      </button>
      {status && <p className="status">{status}</p>}
    </section>
  );
};

export default ImportCard;
