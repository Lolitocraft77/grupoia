import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="bop-pattern flex h-full w-full flex-col items-center justify-center">
      <p className="font-display text-7xl uppercase tracking-widest text-chrome-glow">
        404
      </p>
      <p className="mt-2 text-sm uppercase tracking-widest text-bop-silver/70">
        Página no encontrada
      </p>
      <Link
        to="/"
        className="btn btn-primary mt-8 px-6 py-2 text-sm uppercase tracking-widest"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
