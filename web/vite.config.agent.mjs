// Config TEMPORAL del agente (no commitear): igual que vite.config.js pero
// sin copyPublicDir — el fs.cp de Vite usa copy_file_range, bloqueada por el
// seccomp de la jaula. public/ se copia aparte con syscalls clásicas.
import base from './vite.config.js';
export default { ...base, build: { ...(base.build || {}), copyPublicDir: false } };
