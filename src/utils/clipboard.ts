export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    alert('Copiado para clipboard!');
  } catch (e) {
    console.error('Falha ao copiar', e);
  }
}
