import { useEffect, useRef, useState } from 'react';
import { AlertCircle, FileText, ImagePlus, Trash2, UploadCloud } from 'lucide-react';

// Adjuntos del formulario (#297). El cliente pedía fotos y medidas… pero no
// había forma de mandarlas. Aquí se sube lo que sea (fotos del ambiente,
// capturas, planos en PDF) y viaja adjunto al correo.
export const MAX_FILES = 6;
export const MAX_FILE_BYTES = 8 * 1024 * 1024; // por fichero, ya comprimido
export const MAX_TOTAL_BYTES = 15 * 1024 * 1024; // suma de todos

const ACCEPTED = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'application/pdf',
];

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Las fotos de móvil pesan 3-6 MB y no aportan nada por encima de 1920 px en
// un correo: se reescalan en el navegador. Si el navegador no sabe decodificar
// el formato (HEIC de iPhone, p.ej.) se manda el original tal cual.
async function compressImage(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  if (typeof createImageBitmap !== 'function') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const maxDim = 1920;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 900 * 1024) {
      bitmap.close?.();
      return file;
    }
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.82),
    );
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, '') || 'foto';
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export default function AttachmentsField({ files, onChange, disabled = false }) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Las previews son object URLs: hay que revocarlas o se filtra memoria. El
  // cleanup necesita la lista VIVA (con deps [] capturaría el array del primer
  // render y no revocaría nada al desmontar).
  const liveFiles = useRef(files);
  liveFiles.current = files;
  useEffect(
    () => () => liveFiles.current.forEach((f) => f.preview && URL.revokeObjectURL(f.preview)),
    [],
  );

  const addFiles = async (incoming) => {
    const list = Array.from(incoming || []);
    if (!list.length) return;
    setBusy(true);
    setError('');

    const problems = [];
    const accepted = [];
    let total = files.reduce((sum, f) => sum + f.file.size, 0);

    for (const raw of list) {
      if (files.length + accepted.length >= MAX_FILES) {
        problems.push(`Máximo ${MAX_FILES} archivos.`);
        break;
      }
      if (raw.type && !ACCEPTED.includes(raw.type)) {
        problems.push(`"${raw.name}": formato no admitido (fotos o PDF).`);
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const file = await compressImage(raw);
      if (file.size > MAX_FILE_BYTES) {
        problems.push(`"${raw.name}" pesa ${formatBytes(file.size)} (máx. ${formatBytes(MAX_FILE_BYTES)}).`);
        continue;
      }
      if (total + file.size > MAX_TOTAL_BYTES) {
        problems.push(`Se supera el total de ${formatBytes(MAX_TOTAL_BYTES)}.`);
        break;
      }
      total += file.size;
      accepted.push({
        id: `${file.name}-${file.size}-${accepted.length}-${files.length}`,
        file,
        preview: file.type.startsWith('image/') && file.type !== 'image/heic'
          ? URL.createObjectURL(file)
          : '',
      });
    }

    if (accepted.length) onChange([...files, ...accepted]);
    setError(problems.join(' '));
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (id) => {
    const target = files.find((f) => f.id === id);
    if (target?.preview) URL.revokeObjectURL(target.preview);
    onChange(files.filter((f) => f.id !== id));
  };

  const totalBytes = files.reduce((sum, f) => sum + f.file.size, 0);

  return (
    <div className="attach-field">
      <div
        className={`attach-drop ${dragging ? 'is-dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(e.dataTransfer?.files);
        }}
      >
        <button
          type="button"
          className="attach-cta"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy || files.length >= MAX_FILES}
        >
          <span className="attach-cta-icon" aria-hidden="true">
            <UploadCloud size={26} />
          </span>
          <span className="attach-cta-text">
            <strong>
              {busy ? 'Preparando archivos…' : 'Sumá fotos, planos o medidas'}
            </strong>
            <small>
              Mandanos lo que tengas: fotos del ambiente, capturas, un croquis o
              un PDF. Cuanto más veamos, mejor te presupuestamos.
            </small>
            <span className="attach-cta-hint">
              <ImagePlus size={12} aria-hidden="true" />
              Hasta {MAX_FILES} archivos · {formatBytes(MAX_TOTAL_BYTES)} en total ·
              JPG, PNG, WEBP o PDF
            </span>
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          className="attach-input"
          multiple
          accept="image/*,application/pdf"
          onChange={(e) => addFiles(e.target.files)}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {files.length > 0 && (
        <ul className="attach-list">
          {files.map((item) => (
            <li key={item.id} className="attach-item">
              {item.preview ? (
                <img className="attach-thumb" src={item.preview} alt="" />
              ) : (
                <span className="attach-thumb attach-thumb-doc" aria-hidden="true">
                  <FileText size={18} />
                </span>
              )}
              <span className="attach-item-text">
                <strong title={item.file.name}>{item.file.name}</strong>
                <small>{formatBytes(item.file.size)}</small>
              </span>
              <button
                type="button"
                className="attach-remove"
                onClick={() => remove(item.id)}
                aria-label={`Quitar ${item.file.name}`}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <p className="attach-total">
          {files.length} de {MAX_FILES} archivos · {formatBytes(totalBytes)}
        </p>
      )}

      {error && (
        <p className="attach-error">
          <AlertCircle size={13} aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}
