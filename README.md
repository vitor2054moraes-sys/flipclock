# 🕐 Flip Clock

Relógio analógico clássico de abas (*flip clock*) em HTML, CSS e JavaScript puro — fundo escuro, números brancos e animação de virada 3D real.

---

## ✨ Recursos

- **Relógio** — flip 3D real nas horas e minutos, segundos estáticos ao lado
- **Formato 12h / 24h** — alternância com indicador AM/PM, preferência salva no navegador
- **Cronômetro** — precisão de centésimos, pausa/retomada e registro de voltas
- **Temporizador** — entrada manual (hh:mm:ss) e presets rápidos (1, 5, 10, 25 min)
- **Alarme** — beep-beep-beep no estilo clássico Motorola, gerado via Web Audio API (sem arquivos de áudio)
- **Responsivo** — tipografia fluida com `clamp()`, funciona de celular a monitor 4K
- **Zero dependências** — nenhum framework, nenhum build, nenhum pacote

---

## 📁 Estrutura

```
flip-clock/
├── index.html    # marcação e abas
├── style.css     # tema escuro e animação de virada
├── script.js     # relógio, cronômetro, temporizador e áudio
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
