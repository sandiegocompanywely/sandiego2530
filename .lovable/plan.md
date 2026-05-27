## O que vou fazer

Trocar as 3 estampas placeholder atuais (Abstract, Nature, Essential) pelas 4 estampas reais que você enviou, usando o nome do arquivo como nome da estampa no app.

### Estampas que entrarão no carrossel

1. **DTF 137 - Berry - Letra Azul**
2. **DTF 149 - Coração Rachado - Letra Bege**
3. **DTF 147 - Onça Feline - Letra Bege**
4. **DTF 135 - Athletic - Colorido**

### Passos

1. Copiar os 4 PNGs de `user-uploads://` para `src/assets/prints/` (nomes normalizados sem acento/espaços para o import funcionar, mas o **nome exibido** mantém o original com acentos e maiúsculas).
2. Atualizar `src/routes/index.tsx`:
   - Trocar o tipo `Print` de `{ name; svg }` para `{ name; img }` (imagem importada).
   - Substituir o array `PRINTS` pelas 4 novas estampas.
   - No preview da camiseta, renderizar `<img>` em vez do SVG inline (mesmo posicionamento e tamanho atuais).
   - Nos thumbnails do carrossel, mostrar a imagem real em vez do SVG.

### Como adicionar mais estampas depois (Opção 1)

É só você me mandar novos PNGs no chat — eu copio para `src/assets/prints/` e adiciono no array. Quando o catálogo crescer muito (ex.: 20+) ou você quiser autonomia para gerenciar sozinho, partimos para a **Opção 2 (painel admin com Lovable Cloud)**.

### Detalhes técnicos

- Imports ES6 (`import berry from "@/assets/prints/dtf-137-berry.png"`) para o Vite otimizar/cachear.
- Mantém o efeito de fade ao trocar e o mesmo container `aspect-[4/5]`.
- Sem mudanças no backend, no design system ou em outras telas.
