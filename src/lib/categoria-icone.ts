import {
  BookOpen,
  Dumbbell,
  Gamepad2,
  Gem,
  HeartPulse,
  Home,
  Laptop,
  PawPrint,
  Shirt,
  Smartphone,
  Sparkles,
  Tag,
  UtensilsCrossed,
  Watch,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

// Ícone por palavra-chave no NOME da categoria (pt/es) — categorias são texto
// livre cadastrado pela franquia, então casamos por substring. Padrão herdado
// do getCategoryIcon do OfertasParaguai.
const MAPA: Array<[RegExp, LucideIcon]> = [
  [/eletr[oô]|electr[oó]|celular|smartphone|telefone|tel[eé]fono/i, Smartphone],
  [/inform[aá]tica|tecnolog|computador|notebook|laptop/i, Laptop],
  [/moda|roupa|ropa|vestu[aá]rio|cal[cç]ado|zapat/i, Shirt],
  [/casa|hogar|decora|m[oó]vel|mueble|cozinha|cocina/i, Home],
  [/beleza|belleza|cosm[eé]tico|perfum|maquiagem|maquillaje/i, Sparkles],
  [/esporte|deporte|fitness|academia|gym/i, Dumbbell],
  [/aliment|comida|bebida|food/i, UtensilsCrossed],
  [/brinquedo|juguete|game|jogo|juego/i, Gamepad2],
  [/livro|libro|papelaria|papeler[ií]a/i, BookOpen],
  [/sa[uú]de|salud|farm[aá]cia/i, HeartPulse],
  [/pet|mascota|animal/i, PawPrint],
  [/ferramenta|herramienta|constru/i, Wrench],
  [/rel[oó]gio|reloj|acess[oó]rio|accesorio/i, Watch],
  [/j[oó]ia|joya|bijuteria/i, Gem],
]

export function iconeDaCategoria(nome: string): LucideIcon {
  for (const [re, icone] of MAPA) {
    if (re.test(nome)) return icone
  }
  return Tag
}
