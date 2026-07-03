# O Chá da Alice — Convite interativo 🫖

Convite de chá de bebê com tema *Alice no País das Maravilhas*, 100% responsivo
(feito para abrir no celular), com confirmação de presença (RSVP) gravada direto
numa **planilha do Google Sheets** — sem banco de dados e sem servidor.

- **`index.html`** — estrutura e textos do convite.
- **`styles/main.css`** — índice dos arquivos de estilo, via `@import`.
- **`styles/*.css`** — estilos por área: base, tipografia, hero, detalhes, RSVP, rodapé etc.
- **`scripts/config.js`** — dados fáceis de alterar, como URL do Apps Script e calendário.
- **`scripts/app.js`** — inicializa o convite.
- **`scripts/*.js`** — comportamento separado por responsabilidade: telefone, efeitos, acompanhantes, RSVP, calendário e validação.
- **`apps-script/Code.gs`** — o script que grava as confirmações na sua planilha.

---

## Como colocar no ar (≈ 5 minutos)

### 1. Criar a planilha + publicar o script

1. Crie uma planilha nova no [Google Sheets](https://sheets.new).
2. Menu **Extensões → Apps Script**.
3. Apague o código de exemplo e **cole todo o conteúdo de `apps-script/Code.gs`**.
4. Clique em **Implantar → Nova implantação**.
5. Em "Selecionar tipo" (ícone de engrenagem), escolha **App da Web**.
   - **Executar como:** Eu (sua conta)
   - **Quem tem acesso:** **Qualquer pessoa**
6. Clique em **Implantar** e autorize o acesso (é sua própria conta/planilha).
7. Copie a **URL do app da Web** (termina em `/exec`).

> A aba `Confirmações` é criada sozinha no primeiro envio, com as colunas:
> Data/Hora · Nome · WhatsApp · WhatsApp (formatado) · Confirmações.

### 2. Ligar o convite à planilha

Abra `scripts/config.js` e cole a URL em `appsScriptUrl`:

```js
appsScriptUrl: "https://script.google.com/macros/s/AKfy.../exec",
```

Enquanto esse valor estiver **vazio**, o convite funciona em **modo demonstração**:
mostra a tela de sucesso, mas **não grava nada** (útil pra testar o visual).

### 3. Hospedar

É um site estático — pode subir em qualquer lugar grátis:

- **Vercel / Netlify:** arraste a pasta na interface, ou `vercel` / `netlify deploy`.
- **GitHub Pages:** suba o `index.html` num repositório e ative Pages.

Depois é só mandar o link no WhatsApp. 🎉

---

## Como funciona o "WhatsApp como chave única"

- Cada pessoa (o convidado principal **e** cada acompanhante) vira **uma linha**.
- O número de WhatsApp é normalizado (só dígitos) e usado como chave.
- Se o mesmo número confirmar de novo, o script **atualiza** a linha existente e
  incrementa a coluna **Confirmações** — em vez de criar duplicata.
- No próprio formulário, também não é possível repetir o mesmo número entre os
  acompanhantes do mesmo envio.

## Detalhes do evento (já embutidos no convite)

| | |
|---|---|
| **Data** | Sábado, 08 de agosto de 2026 |
| **Horário** | 15h30 |
| **Local** | Mansão N&N |
| **Presente** | Fraldas M e G (Pampers ou Huggies) + 1 mimo |

O botão **"Salvar no calendário"** gera um arquivo `.ics` com esses dados.

---

## Personalização rápida

- **Cores:** variáveis CSS em `styles/tokens.css` (`--sage`, `--alice`, `--rose`…).
- **Textos:** direto no HTML de cada seção.
- **Fontes:** Fraunces (títulos) + Newsreader (corpo), via Google Fonts.
- **Calendário:** dados do arquivo `.ics` em `scripts/config.js`.
- **Formulário:** lógica de envio em `scripts/rsvp.js`; validação em `scripts/validation.js`.
- **Menos animação:** o site respeita automaticamente `prefers-reduced-motion`.
