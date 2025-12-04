import { useRef, useState } from "react";

interface Props {
  title: string;
  description: string;
  accept?: string;
  onUpload: (file: File) => Promise<unknown>;
}

const FileUploadCard = ({ title, description, accept, onUpload }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setLoading(true);
    setStatus("");
    try {
      await onUpload(files[0]);
      setStatus("Upload complete");
    } catch (error) {
      setStatus("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="card drop-zone"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        handleFiles(event.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <header>
        <h3>{title}</h3>
        <p>{description}</p>
      </header>
      <p className="drop-hint">Drag & drop files here or click to browse</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => handleFiles(event.target.files)}
      />
      <button disabled={loading}>{loading ? "Uploading..." : "Select file"}</button>
      {status && <p className="status">{status}</p>}
    </section>
  );
};

export default FileUploadCard;
