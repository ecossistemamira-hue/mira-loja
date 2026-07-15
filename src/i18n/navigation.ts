import { createNavigation } from 'next-intl/navigation'

import { routing } from './routing'

// Wrappers locale-aware do next/link e next/navigation — TODA navegação
// interna de página deve usar estes (mantêm o prefixo /pt automaticamente).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
