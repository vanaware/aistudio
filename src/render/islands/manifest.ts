/**
 * Dynamic Islands Resolution.
 * Nenhuma lista fixa de ilhas no código: todas as ilhas são carregadas sob demanda
 * diretamente pelo nome de arquivo existente na pasta islands/ ou island/.
 */

export function resolveIslandFileName(name: string): string {
  return name.endsWith(".js") ? name : `${name}.js`;
}

// Conjunto vazio para retrocompatibilidade: ilhas agora são descobertas dinamicamente pelo arquivo no MD
export const islandNames: readonly string[] = [];
export const islandNamesSet: Set<string> = new Set<string>();
