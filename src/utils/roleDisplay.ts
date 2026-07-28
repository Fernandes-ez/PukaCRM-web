/** O backend chama o cargo de dono da empresa de "Owner" — na UI mostramos "Dono". */
export function displayRoleName(name: string): string {
  return name.trim().toLowerCase() === 'owner' ? 'Dono' : name
}
