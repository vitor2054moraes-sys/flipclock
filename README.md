# Virada — relógio de virar

**Virada** (antes "Flip Clock") é o relógio clássico de plaquinhas que viram (*flip clock*) em HTML, CSS e JavaScript
puro — fundo escuro, números brancos e animação de virada 3D real. O nome vem do momento em que o número vira.

---

## ✨ Recursos

- **Relógio** — flip 3D real nas horas e minutos, segundos estáticos ao lado
- **Formato 12h / 24h** — alternância com indicador AM/PM, preferência salva no navegador
- **Data** embaixo do relógio e **tela cheia** (relógio de mesa: as plaquinhas ficam enormes e a tela fica acesa,
  onde o navegador deixa)
- **Cronômetro** — precisão de centésimos, pausa/retomada e registro de voltas
- **Temporizador** — entrada manual (hh:mm:ss) e presets rápidos (1, 5, 10, 25 min)
- **Alarme** — bip-bip-bip no estilo clássico, gerado via Web Audio API (sem arquivos de áudio), com vibração e o
  aviso no título da aba
- **Responsivo** — tipografia fluida com `clamp()`, funciona de celular a monitor 4K
- **Zero dependências** — nenhum framework, nenhum build, nenhum pacote

---

## 📁 Estrutura

```
flipclock/
├── index.html    # marcação e abas
├── style.css     # tema escuro e animação de virada
├── script.js     # relógio, cronômetro, temporizador, áudio e teclado
├── icone.svg     # o ícone (uma plaquinha)
└── README.md
```

---



### Rodando localmente

Basta abrir o `index.html` no navegador. Para evitar restrições de áudio em alguns navegadores, prefira um servidor local:

```bash
python -m http.server 8000
# depois acesse http://localhost:8000
```

---

## ⌨️ Atalhos de teclado

| Tecla     | Ação                                              |
|-----------|---------------------------------------------------|
| `Espaço`  | Inicia / pausa (ou silencia o alarme)             |
| `Esc`     | Silencia o alarme                                 |
| `R`       | Zera cronômetro ou temporizador                   |
| `L`       | Registra uma volta no cronômetro                  |

---

## 🎨 Personalização

Edite as variáveis no topo do `style.css`:

```css
:root {
  --bg:      #000;     /* fundo da página     */
  --card:    #101010;  /* cor do cartão       */
  --card-hi: #1a1a1a;  /* brilho superior     */
  --txt:     #f2f2f2;  /* cor dos números     */
}
```

---

## 🔒 Segurança e acessibilidade

- A página só carrega arquivos dela mesma (Content-Security-Policy) e é montada sem `innerHTML`.
- Tudo conta pela hora do aparelho: nada atrasa com a aba em segundo plano.
- Abas com marcação para leitor de tela; a hora é lida uma vez por minuto (as plaquinhas ficam escondidas dele).
- Os campos do temporizador ficam nos limites (99 h, 59 min, 59 s).
