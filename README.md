# Osobní vizitka (černobílá)

Tento repozitář obsahuje jednoduchou, moderní a responzivní osobní vizitku v černobílém barevném schématu.

## Co je zde

- `index.html` — hlavní stránka s vizitkou (obsah upravíte přímo v souboru)
- `styles.css` — styly (černobílé, responzivní)
- `avatar.svg` — výchozí avatar (můžete nahradit vlastním obrázkem)
- `.github/workflows/deploy.yml` — (volitelně) workflow pro automatické nasazení na GitHub Pages

## Jak upravit

1. Otevřete `index.html` a nahraďte placeholdery:
   - `Jméno Příjmení` → své jméno
   - `YYYY-MM-DD` → datum narození
   - `Frontend Developer` → pracovní pozice
   - `email@example.com` → svůj e-mail
   - `+420 000 000 000` → telefon
2. Pokud chcete vlastní fotku, nahraďte `avatar.svg` souborem `avatar.jpg` nebo `avatar.png` a upravte `src` v `index.html`.

## Publikace na GitHub Pages

Možnosti:

1. **Ručně (nejjednodušší)**
   - V repozitáři jděte do Settings → Pages → Source → vyberte `main` branch a `/(root)` a klikněte Save.
   - Po chvíli bude stránka dostupná na `https://<uživatel>.github.io/<repo>`.

2. **Automatické nasazení přes GitHub Actions**
   - Povolit workflow v `.github/workflows/deploy.yml` (můžete ho upravit nebo odstranit).
   - Workflow nasazuje obsah repozitáře do větve `gh-pages` po každém pushi do `main`.

   ## Commit & Push (PowerShell)

   1. Otevřete PowerShell v kořeni repozitáře a spusťte:

   ```powershell
   git add .;
   git commit -m "Add personal business card";
   git push origin main;
   ```

   Po prvním pushi workflow automaticky vytvoří a aktualizuje větev `gh-pages` (pokud používáte workflow). Pokud chcete publikovat ručně, použijte sekci Settings → Pages.

## Tipy
- Pokud chcete vlastní doménu, přidejte `CNAME` soubor do kořene repozitáře.
- Pro lepší SEO a sdílení upravte meta tagy v `index.html`.

---

Pokud chcete, můžu za vás přidat automatické nasazení pomocí GitHub Actions a pomoci s nastavením GitHub Pages — dejte vědět, jestli chcete, abych to přidal do tohoto repozitáře.