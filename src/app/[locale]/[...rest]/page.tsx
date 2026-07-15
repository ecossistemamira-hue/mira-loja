import { notFound } from 'next/navigation'

// Catch-all: URLs desconhecidas caem aqui e rendem o not-found LOCALIZADO
// do segmento [locale] (sem isto o Next mostraria o 404 default, já que não
// existe mais layout/not-found na raiz de src/app).
export default function CatchAllPage() {
  notFound()
}
